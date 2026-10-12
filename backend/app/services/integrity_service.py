from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.stock_balances import StockBalance
from backend.app.models.stock_movements import StockMovement
from backend.app.schemas.inventory import IntegrityCheckResponse

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
