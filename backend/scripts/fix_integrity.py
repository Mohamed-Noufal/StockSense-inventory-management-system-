import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.database import SessionLocal
from backend.app.models.stock_balances import StockBalance
from backend.app.models.stock_movements import StockMovement
from backend.app.services.inventory_service import run_integrity_check

def fix():
    db = SessionLocal()
    # Check item 32
    check = run_integrity_check(db)
    print(f"Current mismatches: {check.mismatches_count}")
    for m in check.mismatches:
        item_id = m["item_id"]
        loc_id = m["location_id"]
        bal = db.query(StockBalance).filter_by(item_id=item_id, location_id=loc_id).first()
        # Find ledger sum
        from sqlalchemy import func
        l_sum = db.query(func.coalesce(func.sum(StockMovement.quantity), 0)).filter(
            StockMovement.item_id == item_id,
            StockMovement.location_id == loc_id
        ).scalar()
        if bal:
            bal.quantity_on_hand = int(l_sum)
            print(f"Synchronized item {item_id} loc {loc_id} balance to ledger sum: {l_sum}")
    db.commit()
    new_check = run_integrity_check(db)
    print(f"Post-fix mismatches: {new_check.mismatches_count} (Status: {new_check.status})")
    db.close()

if __name__ == "__main__":
    fix()
