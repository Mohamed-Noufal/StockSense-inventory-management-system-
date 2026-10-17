import uuid
from datetime import datetime, timezone, timedelta
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

def post_movement(db: Session, m_in: MovementCreate, commit: bool = True) -> StockMovement:
    item = db.query(Item).filter_by(id=m_in.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Item ID {m_in.item_id} not found")
    loc = db.query(Location).filter_by(id=m_in.location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location ID {m_in.location_id} not found")

    m_type = m_in.movement_type.upper()
    if m_type not in ("RECEIPT", "ISSUE", "ADJUSTMENT"):
        raise HTTPException(status_code=400, detail=f"Invalid movement type: {m_type}")

    if m_type == "RECEIPT":
        signed_qty = abs(m_in.quantity)
    elif m_type == "ISSUE":
        signed_qty = -abs(m_in.quantity)
    else:  # ADJUSTMENT
        direction = (m_in.adjustment_direction or "SURPLUS").upper()
        signed_qty = -abs(m_in.quantity) if direction == "SHRINKAGE" else abs(m_in.quantity)

    # B-2: Idempotency check with payload fingerprint verification
    if m_in.idempotency_key:
        existing = db.query(StockMovement).filter_by(idempotency_key=m_in.idempotency_key).first()
        if existing:
            if (
                existing.item_id != m_in.item_id
                or existing.location_id != m_in.location_id
                or existing.quantity != signed_qty
            ):
                raise HTTPException(
                    status_code=409,
                    detail=f"Idempotency conflict: key '{m_in.idempotency_key}' previously used with different movement parameters."
                )
            return existing

    now_iso = datetime.now(timezone.utc).isoformat()

    # B-3: Atomic balance update protected against concurrency races
    if signed_qty < 0:
        affected = (
            db.query(StockBalance)
            .filter(
                StockBalance.item_id == m_in.item_id,
                StockBalance.location_id == m_in.location_id,
                StockBalance.quantity_on_hand >= abs(signed_qty),
            )
            .update(
                {
                    StockBalance.quantity_on_hand: StockBalance.quantity_on_hand + signed_qty,
                    StockBalance.updated_at: now_iso,
                },
                synchronize_session=False,
            )
        )
        if affected == 0:
            current_q = (
                db.query(StockBalance.quantity_on_hand)
                .filter_by(item_id=m_in.item_id, location_id=m_in.location_id)
                .scalar()
                or 0
            )
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item.sku} at {loc.code}. Available: {current_q}, requested: {abs(signed_qty)}"
            )
    else:
        _get_or_create_balance(db, m_in.item_id, m_in.location_id)
        db.query(StockBalance).filter(
            StockBalance.item_id == m_in.item_id,
            StockBalance.location_id == m_in.location_id,
        ).update(
            {
                StockBalance.quantity_on_hand: StockBalance.quantity_on_hand + signed_qty,
                StockBalance.updated_at: now_iso,
            },
            synchronize_session=False,
        )

    reason_text = m_in.reason or ""
    if m_in.destination_label and m_type == "ISSUE" and m_in.destination_label not in reason_text:
        reason_text = f"To: {m_in.destination_label}" + (f" - {reason_text}" if reason_text else "")

    movement = StockMovement(
        item_id=m_in.item_id,
        location_id=m_in.location_id,
        movement_type=m_type,
        quantity=signed_qty,
        project_id=m_in.project_id if m_type == "ISSUE" else None,
        reference_type=m_in.reference_type or "MANUAL",
        reference_id=m_in.reference_id,
        reason=reason_text,
        idempotency_key=m_in.idempotency_key,
        actor_label=m_in.actor_label,
        occurred_at=now_iso,
        created_at=now_iso,
    )
    db.add(movement)
    if commit:
        db.commit()
        db.refresh(movement)
    else:
        db.flush()
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

    # B-2: Check transfer idempotency
    if t_in.idempotency_key:
        existing_out = db.query(StockMovement).filter_by(idempotency_key=f"{t_in.idempotency_key}_out").first()
        if existing_out:
            if (
                existing_out.item_id != t_in.item_id
                or existing_out.location_id != t_in.from_location_id
                or abs(existing_out.quantity) != t_in.quantity
            ):
                raise HTTPException(
                    status_code=409,
                    detail=f"Idempotency conflict: transfer key '{t_in.idempotency_key}' previously used with different parameters."
                )
            existing_in = db.query(StockMovement).filter_by(idempotency_key=f"{t_in.idempotency_key}_in").first()
            return {
                "transfer_group_id": existing_out.transfer_group_id,
                "out_id": existing_out.id,
                "in_id": existing_in.id if existing_in else None,
                "quantity": abs(existing_out.quantity),
            }

    now_iso = datetime.now(timezone.utc).isoformat()

    # B-3: Atomic decrement at origin
    affected = (
        db.query(StockBalance)
        .filter(
            StockBalance.item_id == t_in.item_id,
            StockBalance.location_id == t_in.from_location_id,
            StockBalance.quantity_on_hand >= t_in.quantity,
        )
        .update(
            {
                StockBalance.quantity_on_hand: StockBalance.quantity_on_hand - t_in.quantity,
                StockBalance.updated_at: now_iso,
            },
            synchronize_session=False,
        )
    )
    if affected == 0:
        avail = (
            db.query(StockBalance.quantity_on_hand)
            .filter_by(item_id=t_in.item_id, location_id=t_in.from_location_id)
            .scalar()
            or 0
        )
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock at {from_loc.code}. Available: {avail}, transfer requested: {t_in.quantity}"
        )

    # Atomic increment at destination
    _get_or_create_balance(db, t_in.item_id, t_in.to_location_id)
    db.query(StockBalance).filter(
        StockBalance.item_id == t_in.item_id,
        StockBalance.location_id == t_in.to_location_id,
    ).update(
        {
            StockBalance.quantity_on_hand: StockBalance.quantity_on_hand + t_in.quantity,
            StockBalance.updated_at: now_iso,
        },
        synchronize_session=False,
    )

    transfer_group_id = str(uuid.uuid4())
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

def get_operations_stats(db: Session, days: int = 7) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    current_cutoff = (now - timedelta(days=days)).isoformat()
    prior_cutoff = (now - timedelta(days=days * 2)).isoformat()

    def _get_counts_and_trend(m_type: str) -> tuple[int, float]:
        curr = (
            db.query(func.count(StockMovement.id))
            .filter(
                StockMovement.movement_type == m_type,
                StockMovement.occurred_at >= current_cutoff,
            )
            .scalar()
            or 0
        )
        prev = (
            db.query(func.count(StockMovement.id))
            .filter(
                StockMovement.movement_type == m_type,
                StockMovement.occurred_at >= prior_cutoff,
                StockMovement.occurred_at < current_cutoff,
            )
            .scalar()
            or 0
        )
        if prev > 0:
            trend = round(((curr - prev) / prev) * 100.0, 1)
        else:
            trend = 0.0 if curr == 0 else 100.0
        return curr, trend

    issues, issues_trend = _get_counts_and_trend("ISSUE")
    transfers, transfers_trend = _get_counts_and_trend("TRANSFER_OUT")
    receipts, receipts_trend = _get_counts_and_trend("RECEIPT")
    adjustments, adjustments_trend = _get_counts_and_trend("ADJUSTMENT")

    return {
        "timeframe_days": days,
        "issues_count": issues,
        "issues_trend_pct": issues_trend,
        "transfers_count": transfers,
        "transfers_trend_pct": transfers_trend,
        "receipts_count": receipts,
        "receipts_trend_pct": receipts_trend,
        "adjustments_count": adjustments,
        "adjustments_trend_pct": adjustments_trend,
    }

from backend.app.models.categories import Category
from backend.app.models.item_suppliers import ItemSupplier
from backend.app.models.suppliers import Supplier
from backend.app.schemas.inventory import ItemCreate

def create_item(db: Session, payload: ItemCreate) -> Item:
    """
    Onboard a new catalog SKU into master data.
    Atomically establishes initial stock balance and ledger movement if initial stock > 0.
    """
    clean_sku = payload.sku.strip().upper()
    existing = db.query(Item).filter(func.upper(Item.sku) == clean_sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Item with SKU '{clean_sku}' already exists.")

    category = db.query(Category).filter_by(id=payload.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail=f"Category ID {payload.category_id} not found.")

    now_iso = datetime.now(timezone.utc).isoformat()
    item = Item(
        sku=clean_sku,
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        category_id=payload.category_id,
        uom=payload.uom.strip() if payload.uom else "EA",
        unit_cost_minor=payload.unit_cost_minor,
        criticality=payload.criticality.upper() if payload.criticality else "STANDARD",
        is_active=1,
        created_at=now_iso,
        updated_at=now_iso,
    )
    db.add(item)
    db.flush()

    if payload.supplier_id:
        supplier = db.query(Supplier).filter_by(id=payload.supplier_id).first()
        if supplier:
            sup_sku = payload.supplier_sku.strip() if payload.supplier_sku else f"VND-{clean_sku}"
            item_sup = ItemSupplier(
                item_id=item.id,
                supplier_id=supplier.id,
                supplier_sku=sup_sku,
                unit_price_minor=payload.unit_cost_minor,
                moq=1,
                order_multiple=1,
                lead_time_days_nominal=14,
                is_preferred=1,
                created_at=now_iso,
                updated_at=now_iso,
            )
            db.add(item_sup)

    if payload.initial_location_id:
        loc = db.query(Location).filter_by(id=payload.initial_location_id).first()
        if loc:
            init_qty = payload.initial_stock or 0
            _get_or_create_balance(db, item.id, loc.id)
            if init_qty > 0:
                m_in = MovementCreate(
                    item_id=item.id,
                    location_id=loc.id,
                    movement_type="RECEIPT",
                    quantity=init_qty,
                    reason="Initial catalog registration receipt",
                    actor_label="Inventory Manager",
                )
                post_movement(db, m_in, commit=False)

    db.commit()
    db.refresh(item)
    return item

