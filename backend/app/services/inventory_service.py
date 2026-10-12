import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from backend.app.models.items import Item
from backend.app.models.locations import Location
from backend.app.models.stock_balances import StockBalance
from backend.app.models.stock_movements import StockMovement
from backend.app.schemas.inventory import MovementCreate, TransferCreate, IntegrityCheckResponse

def _get_or_create_balance(db: Session, item_id: int, location_id: int) -> StockBalance:
    balance = db.query(StockBalance).filter_by(item_id=item_id, location_id=location_id).first()
    if not balance:
        balance = StockBalance(item_id=item_id, location_id=location_id, quantity_on_hand=0)
        db.add(balance)
        db.flush()
    return balance

def post_movement(db: Session, m_in: MovementCreate) -> StockMovement:
    if m_in.idempotency_key:
        existing = db.query(StockMovement).filter_by(idempotency_key=m_in.idempotency_key).first()
        if existing:
            return existing

    item = db.query(Item).filter_by(id=m_in.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Item ID {m_in.item_id} not found")
    loc = db.query(Location).filter_by(id=m_in.location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location ID {m_in.location_id} not found")

    m_type = m_in.movement_type.upper()
    if m_type not in ("RECEIPT", "ISSUE", "ADJUSTMENT"):
        raise HTTPException(status_code=400, detail=f"Invalid movement type: {m_type}")

    signed_qty = m_in.quantity if m_type == "RECEIPT" else -m_in.quantity
    balance = _get_or_create_balance(db, m_in.item_id, m_in.location_id)

    if signed_qty < 0 and (balance.quantity_on_hand + signed_qty < 0):
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for {item.sku} at {loc.code}. Available: {balance.quantity_on_hand}, requested: {abs(signed_qty)}"
        )

    balance.quantity_on_hand += signed_qty
    balance.updated_at = datetime.now(timezone.utc).isoformat()

    now_iso = datetime.now(timezone.utc).isoformat()
    movement = StockMovement(
        item_id=m_in.item_id,
        location_id=m_in.location_id,
        movement_type=m_type,
        quantity=signed_qty,
        project_id=m_in.project_id if m_type == "ISSUE" else None,
        reference_type=m_in.reference_type or "MANUAL",
        reference_id=m_in.reference_id,
        reason=m_in.reason,
        idempotency_key=m_in.idempotency_key,
        actor_label=m_in.actor_label,
        occurred_at=now_iso,
        created_at=now_iso,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement

def transfer_stock(db: Session, t_in: TransferCreate) -> Dict[str, Any]:
    if t_in.from_location_id == t_in.to_location_id:
        raise HTTPException(status_code=400, detail="Source and destination locations cannot be the same")

    item = db.query(Item).filter_by(id=t_in.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Item ID {t_in.item_id} not found")
    from_loc = db.query(Location).filter_by(id=t_in.from_location_id).first()
    to_loc = db.query(Location).filter_by(id=t_in.to_location_id).first()
    if not from_loc or not to_loc:
        raise HTTPException(status_code=404, detail="Source or destination location not found")

    from_bal = _get_or_create_balance(db, t_in.item_id, t_in.from_location_id)
    if from_bal.quantity_on_hand < t_in.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock at {from_loc.code}. Available: {from_bal.quantity_on_hand}, transfer requested: {t_in.quantity}"
        )

    to_bal = _get_or_create_balance(db, t_in.item_id, t_in.to_location_id)
    transfer_group_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    from_bal.quantity_on_hand -= t_in.quantity
    from_bal.updated_at = now_iso
    to_bal.quantity_on_hand += t_in.quantity
    to_bal.updated_at = now_iso

    mov_out = StockMovement(
        item_id=t_in.item_id, location_id=t_in.from_location_id,
        movement_type="TRANSFER_OUT", quantity=-t_in.quantity,
        transfer_group_id=transfer_group_id, reason=t_in.reason,
        idempotency_key=f"{t_in.idempotency_key}_out" if t_in.idempotency_key else None,
        actor_label=t_in.actor_label, occurred_at=now_iso, created_at=now_iso
    )
    mov_in = StockMovement(
        item_id=t_in.item_id, location_id=t_in.to_location_id,
        movement_type="TRANSFER_IN", quantity=t_in.quantity,
        transfer_group_id=transfer_group_id, reason=t_in.reason,
        idempotency_key=f"{t_in.idempotency_key}_in" if t_in.idempotency_key else None,
        actor_label=t_in.actor_label, occurred_at=now_iso, created_at=now_iso
    )
    db.add(mov_out)
    db.add(mov_in)
    db.commit()
    return {"transfer_group_id": transfer_group_id, "out_id": mov_out.id, "in_id": mov_in.id, "quantity": t_in.quantity}

def run_integrity_check(db: Session) -> IntegrityCheckResponse:
    balances = db.query(StockBalance).all()
    ledger_sums = db.query(
        StockMovement.item_id,
        StockMovement.location_id,
        func.sum(StockMovement.quantity).label("total_qty")
    ).group_by(StockMovement.item_id, StockMovement.location_id).all()
    ledger_map = {(row.item_id, row.location_id): int(row.total_qty or 0) for row in ledger_sums}

    mismatches = []
    items_checked = set()
    locs_checked = set()

    for b in balances:
        items_checked.add(b.item_id)
        locs_checked.add(b.location_id)
        ledger_qty = ledger_map.get((b.item_id, b.location_id), 0)
        if b.quantity_on_hand != ledger_qty:
            mismatches.append({
                "item_id": b.item_id, "location_id": b.location_id,
                "balance_on_hand": b.quantity_on_hand, "ledger_sum": ledger_qty,
                "difference": b.quantity_on_hand - ledger_qty
            })

    return IntegrityCheckResponse(
        status="HEALTHY" if not mismatches else "MISMATCH_DETECTED",
        total_items_checked=len(items_checked),
        total_locations_checked=len(locs_checked),
        mismatches_count=len(mismatches),
        mismatches=mismatches,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
