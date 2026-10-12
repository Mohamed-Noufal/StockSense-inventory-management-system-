from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.stock_movements import StockMovement
from backend.app.models.items import Item

def _parse_utc(dt_str: str) -> datetime:
    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def extract_weekly_demand(
    db: Session,
    cutoff_iso: str,
    history_weeks: int = 52,
    item_id: Optional[int] = None
) -> Dict[int, List[float]]:
    """
    Extracts time-safe weekly demand buckets from stock_movements ledger.
    Guarantees zero future leakage: movements after cutoff_iso are strictly ignored.
    Weeks with no issues are explicitly represented as 0.0.
    """
    cutoff_dt = _parse_utc(cutoff_iso)
    start_dt = cutoff_dt - timedelta(weeks=history_weeks)
    start_iso = start_dt.isoformat()

    items_query = db.query(Item).filter(Item.is_active == 1)
    if item_id:
        items_query = items_query.filter(Item.id == item_id)
    active_items = items_query.all()

    # Initialize zero-filled weekly series for all target items
    demand_series: Dict[int, List[float]] = {
        item.id: [0.0] * history_weeks for item in active_items
    }

    # Query issues strictly within the historical boundary
    movements_query = db.query(StockMovement).filter(
        StockMovement.movement_type == "ISSUE",
        StockMovement.occurred_at >= start_iso,
        StockMovement.occurred_at <= cutoff_iso
    )
    if item_id:
        movements_query = movements_query.filter(StockMovement.item_id == item_id)

    movements = movements_query.all()
    seconds_per_week = 7 * 86400

    for mov in movements:
        if mov.item_id not in demand_series:
            continue
        try:
            mov_dt = _parse_utc(mov.occurred_at)
        except (ValueError, TypeError):
            continue

        diff_seconds = (mov_dt - start_dt).total_seconds()
        if diff_seconds < 0:
            continue
        week_idx = int(diff_seconds // seconds_per_week)
        if 0 <= week_idx < history_weeks:
            demand_series[mov.item_id][week_idx] += float(abs(mov.quantity))

    return demand_series

def extract_single_item_demand(
    db: Session,
    item_id: int,
    cutoff_iso: str,
    history_weeks: int = 52
) -> List[float]:
    result = extract_weekly_demand(db, cutoff_iso, history_weeks, item_id=item_id)
    return result.get(item_id, [0.0] * history_weeks)
