import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models.categories import Category
from backend.app.models.locations import Location
from backend.app.models.items import Item
from backend.app.models.stock_balances import StockBalance
from backend.app.models.stock_movements import StockMovement

def seed_mock_items():
    print("Seeding canonical mock items into SQLite database...")
    db = SessionLocal()
    try:
        # 1. Ensure Categories exist
        categories_map = {
            "Mechanical Parts": "Heavy mechanical drilling and hydraulic pump equipment",
            "Pipes & Tubes": "Well control pipes, high-pressure valves, and armored hoses",
            "Tools & Equipment": "PDC rotary drill bits, tongs, and drilling tools",
            "Chemicals": "Rig consumables, hydraulic fluids, and mud additives",
            "Filters": "Coalescers, fuel strainers, and fluid filtration cartridges",
            "Electrical": "Motors, generators, switchgear, and junction boxes",
            "PPE": "Personal protective equipment, hard hats, gloves, and boots",
        }
        cat_objs = {}
        for c_name, c_desc in categories_map.items():
            cat = db.query(Category).filter_by(name=c_name).first()
            if not cat:
                cat = Category(name=c_name, description=c_desc)
                db.add(cat)
                db.flush()
            cat_objs[c_name] = cat

        # 2. Ensure Locations exist
        locations_map = {
            "Main Warehouse": ("WH-MAIN", "Central Base Warehouse", "WAREHOUSE", 1),
            "Field Warehouse": ("WH-FIELD", "Western Desert Field Yard", "WAREHOUSE", 0),
            "Free Zone": ("WH-FZ", "Alexandria Free Zone Logistics", "WAREHOUSE", 0),
        }
        loc_objs = {}
        for l_name, (code, desc, l_type, is_def) in locations_map.items():
            loc = db.query(Location).filter_by(code=code).first()
            if not loc:
                loc = Location(code=code, name=l_name, location_type=l_type, is_default_replenishment=is_def)
                db.add(loc)
                db.flush()
            loc_objs[l_name] = loc

        # 3. Canonical Mock Items Specification
        mock_items = [
            ("HP-001", "Hydraulic Pump", "Mechanical Parts", "Main Warehouse", "pcs", 450000, "CRITICAL", 8),
            ("PV-042", "Pressure Valve", "Pipes & Tubes", "Main Warehouse", "pcs", 65000, "STANDARD", 45),
            ("DB-034", "Drill Bit 3/4\"", "Tools & Equipment", "Field Warehouse", "pcs", 125000, "CRITICAL", 12),
            ("LO-005", "Lubricant Oil 5L", "Chemicals", "Main Warehouse", "can", 3800, "LOW", 3),
            ("FC-012", "Filter Cartridge", "Filters", "Field Warehouse", "pcs", 8500, "STANDARD", 28),
            ("GS-018", "Gasket Set", "Mechanical Parts", "Main Warehouse", "set", 3500, "STANDARD", 0),
            ("DF-073", "Drilling Fluid Additive", "Chemicals", "Free Zone", "drum", 22000, "LOW", 56),
            ("EM-022", "Electric Motor", "Electrical", "Main Warehouse", "pcs", 320000, "CRITICAL", 14),
            ("HH-006", "High Pressure Hose", "Pipes & Tubes", "Field Warehouse", "length", 210000, "CRITICAL", 6),
            ("SH-009", "Safety Helmet", "PPE", "Main Warehouse", "pcs", 2800, "LOW", 120),
        ]

        now = datetime.now(timezone.utc)
        for sku, name, cat_name, loc_name, uom, unit_cost, crit, on_hand in mock_items:
            item = db.query(Item).filter_by(sku=sku).first()
            if not item:
                item = Item(
                    sku=sku,
                    name=name,
                    category_id=cat_objs[cat_name].id,
                    uom=uom,
                    unit_cost_minor=unit_cost,
                    criticality=crit,
                    is_active=1
                )
                db.add(item)
                db.flush()

            loc = loc_objs[loc_name]
            bal = db.query(StockBalance).filter_by(item_id=item.id, location_id=loc.id).first()
            if not bal:
                bal = StockBalance(item_id=item.id, location_id=loc.id, quantity_on_hand=on_hand)
                db.add(bal)
                # Seed initial movement in ledger for audit balance
                if on_hand > 0:
                    mov = StockMovement(
                        item_id=item.id,
                        location_id=loc.id,
                        movement_type="RECEIPT",
                        quantity=on_hand,
                        reference_type="INITIAL_STOCK",
                        actor_label="Storekeeper",
                        reason="Initial verified warehouse balance",
                        occurred_at=(now - timedelta(days=14)).isoformat(),
                        created_at=(now - timedelta(days=14)).isoformat(),
                    )
                    db.add(mov)

        # 4. Seed authentic historical movements for HP-001 (Hydraulic Pump) matching mock
        hp_item = db.query(Item).filter_by(sku="HP-001").first()
        hp_loc = loc_objs["Main Warehouse"]
        if hp_item:
            existing_movs = db.query(StockMovement).filter_by(item_id=hp_item.id).count()
            if existing_movs <= 1:
                # Add historical movements matching the reference mock
                # Sep 28: Receipt +8 (PO-0119)
                # Oct 2: Issue -1 (WO-0041)
                # Oct 5: Transfer +5 (TR-0078)
                # Oct 8: Receipt +10 (PO-0123)
                # Oct 10: Issue -2 (WO-0045)
                hist_movements = [
                    ("2026-09-28T09:15:00Z", "RECEIPT", 8, "PO-0119", "Storekeeper"),
                    ("2026-10-02T14:30:00Z", "ISSUE", -1, "WO-0041", "Storekeeper"),
                    ("2026-10-05T11:00:00Z", "TRANSFER_IN", 5, "TR-0078", "Storekeeper"),
                    ("2026-10-08T16:45:00Z", "RECEIPT", 10, "PO-0123", "Storekeeper"),
                    ("2026-10-10T10:20:00Z", "ISSUE", -2, "WO-0045", "Storekeeper"),
                ]
                for occ, m_type, q, ref, actor in hist_movements:
                    mov = StockMovement(
                        item_id=hp_item.id,
                        location_id=hp_loc.id,
                        movement_type=m_type,
                        quantity=q,
                        reason=ref,
                        actor_label=actor,
                        occurred_at=occ,
                        created_at=occ,
                    )
                    db.add(mov)

        db.commit()
        print("✓ Successfully seeded all mock items, categories, and movements into SQLite!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding mock items: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_mock_items()
