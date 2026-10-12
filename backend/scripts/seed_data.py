import os
import sys
import random
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.database import engine, Base, SessionLocal
from backend.app.models.categories import Category
from backend.app.models.suppliers import Supplier
from backend.app.models.locations import Location
from backend.app.models.projects import Project
from backend.app.models.users import User
from backend.app.models.items import Item
from backend.app.models.item_suppliers import ItemSupplier
from backend.app.models.stock_balances import StockBalance
from backend.app.models.stock_movements import StockMovement
from backend.app.models.purchase_orders import PurchaseOrder, PurchaseOrderLine
from backend.app.services.inventory_service import run_integrity_check

def seed():
    print("==========================================================")
    print("  StockSense — Seeding Deterministic Oilfield Dataset     ")
    print("==========================================================")
    
    random.seed(42)  # Deterministic seed
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Categories
        cat_data = [
            ("DRILLING_PARTS", "Heavy mechanical drilling and mud circulation equipment components"),
            ("SEALS_GASKETS", "Well control elastomers, BOP packings, and high-pressure metallic gaskets"),
            ("CHEMICALS_LUBRICANTS", "Rig operational consumables, thread dopes, and hydraulic fluids"),
        ]
        categories = {}
        for name, desc in cat_data:
            cat = db.query(Category).filter_by(name=name).first()
            if not cat:
                cat = Category(name=name, description=desc)
                db.add(cat)
                db.flush()
            categories[name] = cat
        print(f"✓ Seeded {len(categories)} categories")

        # 2. Locations
        loc_data = [
            ("WH-01", "Central Warehouse (Cairo Base)", "WAREHOUSE", 1),
            ("YARD-01", "Western Desert Field Yard", "YARD", 0),
            ("RIG-01", "Gulf of Suez Rig Site 07", "RIG_SITE", 0),
        ]
        locations = {}
        for code, name, l_type, is_def in loc_data:
            loc = db.query(Location).filter_by(code=code).first()
            if not loc:
                loc = Location(code=code, name=name, location_type=l_type, is_default_replenishment=is_def)
                db.add(loc)
                db.flush()
            locations[code] = loc
        print(f"✓ Seeded {len(locations)} locations")

        # 3. Suppliers
        sup_data = [
            ("PetroParts International", "USA", "orders@petroparts.example.com", 1),
            ("Gulf Industrial Seals Ltd", "UAE", "sales@gulfseals.example.com", 1),
            ("Apex Valve Technologies", "UK", "support@apexvalves.example.com", 1),
            ("Desert Fluid Solutions", "Egypt", "supply@desertfluids.example.com", 0),
        ]
        suppliers = {}
        for name, country, email, is_imp in sup_data:
            sup = db.query(Supplier).filter_by(name=name).first()
            if not sup:
                sup = Supplier(name=name, country=country, contact_email=email, is_import=is_imp)
                db.add(sup)
                db.flush()
            suppliers[name] = sup
        print(f"✓ Seeded {len(suppliers)} suppliers")

        # 4. Projects
        prj_data = [
            ("PRJ-GULF-07", "Gulf of Suez Exploration Well #7", "Rig Petro-07", "2025-01-01", "ACTIVE"),
            ("PRJ-DESERT-12", "Western Desert Infill Drilling Campaign", "Rig Desert-12", "2025-03-01", "ACTIVE"),
            ("PRJ-BASE-MAINT", "Scheduled Fleet Pump Overhaul 2026", "Cairo Yard Facility", "2025-06-01", "PLANNED"),
        ]
        projects = {}
        for code, name, rig, start, status in prj_data:
            prj = db.query(Project).filter_by(code=code).first()
            if not prj:
                prj = Project(code=code, name=name, rig_name=rig, start_date=start, status=status)
                db.add(prj)
                db.flush()
            projects[code] = prj
        print(f"✓ Seeded {len(projects)} projects")

        # 5. Users
        user_data = [
            ("John Doe", "john.doe@stocksense.oilfield", "STOREKEEPER"),
            ("Ahmed Fawzy", "ahmed.fawzy@example.com", "STOREKEEPER"),
            ("Sara Mansour", "sara.mansour@example.com", "PROCUREMENT_OFFICER"),
            ("Khaled Hassan", "khaled.hassan@example.com", "MANAGER"),
        ]
        users = {}
        for fname, email, role in user_data:
            u = db.query(User).filter_by(email=email).first()
            if not u:
                u = User(full_name=fname, email=email, role=role)
                db.add(u)
                db.flush()
            users[email] = u
        print(f"✓ Seeded {len(users)} users")

        # 6. Items & Terms
        items_spec = [
            ("SLV-SEAT-01", "Mud Pump Valve Seat Assembly (Grade 4140)", "DRILLING_PARTS", "pcs", 45000, "CRITICAL", "PetroParts International", 10, 5, 21),
            ("IMP-750-02", "Centrifugal Charge Pump Impeller 11-inch", "DRILLING_PARTS", "pcs", 125000, "CRITICAL", "Apex Valve Technologies", 2, 1, 28),
            ("BOP-PCK-03", "Annular BOP Packing Element 13-5/8", "SEALS_GASKETS", "pcs", 280000, "CRITICAL", "Gulf Industrial Seals Ltd", 1, 1, 14),
            ("VLV-GATE-04", "Mud Gate Valve Stem & Gate 4-inch 5000psi", "DRILLING_PARTS", "pcs", 65000, "CRITICAL", "Apex Valve Technologies", 4, 2, 21),
            ("FLT-COAL-05", "High-Flow Diesel Fuel Coalescer Cartridge", "DRILLING_PARTS", "pcs", 8500, "CRITICAL", "PetroParts International", 20, 10, 14),
            ("SEAL-KIT-06", "Fluid End Elastomer Packing Seal Kit (HNBR)", "SEALS_GASKETS", "set", 18500, "STANDARD", "Gulf Industrial Seals Ltd", 15, 5, 14),
            ("GSK-RTJ-07", "API Ring Type Joint Gasket R-45 (Soft Iron)", "SEALS_GASKETS", "pcs", 3500, "STANDARD", "Gulf Industrial Seals Ltd", 25, 25, 7),
            ("BEAR-RLR-08", "Heavy Duty Spherical Roller Bearing", "DRILLING_PARTS", "pcs", 52000, "STANDARD", "PetroParts International", 4, 2, 21),
            ("VLV-CHK-09", "Subsea Inline Check Valve Poppet & Spring", "DRILLING_PARTS", "pcs", 31000, "STANDARD", "Apex Valve Technologies", 6, 2, 21),
            ("HOSE-HYD-10", "Armored Choke & Kill Hose 3-inch 10k", "DRILLING_PARTS", "length", 210000, "STANDARD", "PetroParts International", 2, 1, 35),
            ("LUB-THRD-11", "API Modified Thread Compound Pipe Dope 20kg", "CHEMICALS_LUBRICANTS", "pail", 12000, "LOW", "Desert Fluid Solutions", 10, 5, 7),
            ("OIL-HYD-12", "ISO VG 46 Anti-Wear Hydraulic Oil 208L Drum", "CHEMICALS_LUBRICANTS", "drum", 38000, "LOW", "Desert Fluid Solutions", 4, 2, 7),
            ("WPR-PIPE-13", "Drill Pipe Wiper Rubber 5-inch Double Lip", "DRILLING_PARTS", "pcs", 4200, "LOW", "Gulf Industrial Seals Ltd", 20, 10, 7),
            ("RAG-IND-14", "Heavy Cotton Industrial Shop Wipers (Bale 50kg)", "CHEMICALS_LUBRICANTS", "bale", 6500, "LOW", "Desert Fluid Solutions", 10, 5, 3),
            ("GLV-NIT-15", "Chemical Resistant Heavy Nitrile Gloves (Pack 100)", "CHEMICALS_LUBRICANTS", "pack", 2800, "LOW", "Desert Fluid Solutions", 25, 10, 7),
        ]

        items = {}
        for sku, name, cat_key, uom, cost, crit, sup_name, moq, mult, lt in items_spec:
            item = db.query(Item).filter_by(sku=sku).first()
            if not item:
                item = Item(
                    sku=sku, name=name, category_id=categories[cat_key].id,
                    uom=uom, unit_cost_minor=cost, criticality=crit
                )
                db.add(item)
                db.flush()
                # Create supplier terms
                term = ItemSupplier(
                    item_id=item.id, supplier_id=suppliers[sup_name].id,
                    supplier_sku=f"VND-{sku}", unit_price_minor=cost,
                    moq=moq, order_multiple=mult, lead_time_days_nominal=lt,
                    is_preferred=1
                )
                db.add(term)
            items[sku] = item
        print(f"✓ Seeded {len(items)} items and supplier terms")

        # 7. Seed Initial Receipts & Balances (if not already seeded)
        wh_loc = locations["WH-01"]
        existing_wh_bal = db.query(StockBalance).filter_by(location_id=wh_loc.id).count()
        if existing_wh_bal == 0:
            print("  Seeding initial stock receipts and historical transactions...")
            base_time = datetime.now(timezone.utc) - timedelta(weeks=52)
            
            # Initial receipts across locations
            for sku, item in items.items():
                init_qty = random.choice([35, 45, 60, 75, 90])
                time_str = (base_time + timedelta(days=1)).isoformat()
                mov = StockMovement(
                    item_id=item.id, location_id=wh_loc.id,
                    movement_type="RECEIPT", quantity=init_qty,
                    reference_type="SYNTHETIC", actor_label="synthetic-seed",
                    occurred_at=time_str, created_at=time_str
                )
                db.add(mov)
                bal = StockBalance(item_id=item.id, location_id=wh_loc.id, quantity_on_hand=init_qty)
                db.add(bal)
                
                # Satellite stock for Rig and Yard
                for loc_key in ("YARD-01", "RIG-01"):
                    sat_loc = locations[loc_key]
                    sat_qty = random.choice([6, 10, 15])
                    m_sat = StockMovement(
                        item_id=item.id, location_id=sat_loc.id,
                        movement_type="RECEIPT", quantity=sat_qty,
                        reference_type="SYNTHETIC", actor_label="synthetic-seed",
                        occurred_at=time_str, created_at=time_str
                    )
                    db.add(m_sat)
                    b_sat = StockBalance(item_id=item.id, location_id=sat_loc.id, quantity_on_hand=sat_qty)
                    db.add(b_sat)
            db.commit()

            # 52 weeks of intermittent demand issues
            prj_list = list(projects.values())
            for week in range(2, 52):
                week_dt = base_time + timedelta(weeks=week)
                for sku, item in items.items():
                    if random.random() < 0.35:
                        bal = db.query(StockBalance).filter_by(item_id=item.id, location_id=wh_loc.id).first()
                        issue_qty = random.randint(1, 4)
                        if bal and bal.quantity_on_hand > issue_qty:
                            bal.quantity_on_hand -= issue_qty
                            bal.updated_at = week_dt.isoformat()
                            mov = StockMovement(
                                item_id=item.id, location_id=wh_loc.id,
                                movement_type="ISSUE", quantity=-issue_qty,
                                project_id=random.choice(prj_list).id,
                                reference_type="SYNTHETIC", actor_label="synthetic-seed",
                                occurred_at=week_dt.isoformat(), created_at=week_dt.isoformat()
                            )
                            db.add(mov)
            db.commit()
            print("✓ Generated 52-week intermittent demand ledger history")

        # 9. Seed Initial Purchase Orders if none exist
        if db.query(PurchaseOrder).count() == 0:
            wh_loc = locations.get("WH-01") or db.query(Location).filter_by(is_default_replenishment=1).first()
            item_list = list(items.values()) if 'items' in locals() else db.query(Item).all()
            supplier_list = list(suppliers.values()) if 'suppliers' in locals() else db.query(Supplier).all()
            
            if item_list and supplier_list and wh_loc:
                # PO 1: APPROVED - ready for warehouse receipt
                po1 = PurchaseOrder(
                    po_number="PO-202610-001",
                    supplier_id=supplier_list[0].id,
                    status="APPROVED",
                    order_date=datetime.now(timezone.utc).isoformat(),
                    notes="Approved replenishment for Cairo central warehouse",
                )
                db.add(po1)
                db.flush()
                db.add(PurchaseOrderLine(
                    po_id=po1.id, item_id=item_list[0].id, destination_location_id=wh_loc.id,
                    qty_ordered=25, qty_received=0, unit_price_minor=item_list[0].unit_cost_minor or 12000
                ))
                if len(item_list) > 1:
                    db.add(PurchaseOrderLine(
                        po_id=po1.id, item_id=item_list[1].id, destination_location_id=wh_loc.id,
                        qty_ordered=15, qty_received=0, unit_price_minor=item_list[1].unit_cost_minor or 8500
                    ))

                # PO 2: DRAFT - pending approval
                if len(supplier_list) > 1 and len(item_list) > 2:
                    po2 = PurchaseOrder(
                        po_number="PO-202610-002",
                        supplier_id=supplier_list[1].id,
                        status="DRAFT",
                        notes="Draft requisition awaiting procurement sign-off",
                    )
                    db.add(po2)
                    db.flush()
                    db.add(PurchaseOrderLine(
                        po_id=po2.id, item_id=item_list[2].id, destination_location_id=wh_loc.id,
                        qty_ordered=10, qty_received=0, unit_price_minor=item_list[2].unit_cost_minor or 45000
                    ))
                db.commit()
                print("✓ Seeded sample Purchase Orders (PO-202610-001 APPROVED, PO-202610-002 DRAFT)")
        
        # Verify ledger integrity immediately
        report = run_integrity_check(db)
        print(f"✓ Verification: {report.status} (Mismatches: {report.mismatches_count})")
        print("==========================================================")
        print("  ✓ Database seeding successfully completed!              ")
        print("==========================================================")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
