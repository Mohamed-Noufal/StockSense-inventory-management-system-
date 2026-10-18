#!/usr/bin/env python3
"""
StockSense Unified Database Seeder CLI
Supports profiles:
  - demo: Complete deterministic oilfield dataset (15 items, 52 weeks demand, POs, attachments)
  - minimal: Master reference data only (categories, locations, suppliers, projects, users)
  - empty: Recreates database tables with schema pragmas only (zero business records)

Usage:
  python backend/scripts/seed.py --profile demo [--reset] [--seed 42]
"""

import os
import sys
import argparse
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

# Ensure repository root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.database import engine, Base, SessionLocal, ensure_schema_migrations
from backend.app.core.config import settings
from backend.app.core.security import hash_password
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
from backend.app.models.attachments import DocumentAttachment
from backend.app.services.integrity_service import run_integrity_check

def seed_master_data(db) -> Dict[str, Any]:
    """Seed foundational master data shared across minimal and demo profiles."""
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

    # 5. Users
    user_data = [
        ("John Doe", "john.doe@stocksense.oilfield", "STOREKEEPER"),
        ("Ahmed Fawzy", "ahmed.fawzy@example.com", "STOREKEEPER"),
        ("Sara Mansour", "sara.mansour@example.com", "PROCUREMENT_OFFICER"),
        ("Khaled Hassan", "khaled.hassan@example.com", "MANAGER"),
    ]
    users = {}
    default_pw_hash = hash_password("stocksense123")
    for fname, email, role in user_data:
        u = db.query(User).filter_by(email=email).first()
        if not u:
            u = User(full_name=fname, email=email, role=role, hashed_password=default_pw_hash)
            db.add(u)
            db.flush()
        users[email] = u

    db.commit()
    return {
        "categories": categories,
        "locations": locations,
        "suppliers": suppliers,
        "projects": projects,
        "users": users,
    }


def seed_demo_items_and_ledger(db, master: Dict[str, Any]):
    """Seed 15 items, 52-week ledger movements, and POs."""
    categories = master["categories"]
    locations = master["locations"]
    suppliers = master["suppliers"]
    projects = master["projects"]

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
            term = ItemSupplier(
                item_id=item.id, supplier_id=suppliers[sup_name].id,
                supplier_sku=f"VND-{sku}", unit_price_minor=cost,
                moq=moq, order_multiple=mult, lead_time_days_nominal=lt,
                is_preferred=1
            )
            db.add(term)
        items[sku] = item

    wh_loc = locations["WH-01"]
    existing_wh_bal = db.query(StockBalance).filter_by(location_id=wh_loc.id).count()
    if existing_wh_bal == 0:
        base_time = datetime.now(timezone.utc) - timedelta(weeks=52)
        # Initial receipts
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

        # 52 weeks of intermittent demand
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

        # Ensure depleted items trigger recommendations while maintaining strict ledger balance
        deplete_skus = ["SLV-SEAT-01", "BOP-PCK-03"]
        recent_dt = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        for d_sku in deplete_skus:
            if d_sku in items:
                d_item = items[d_sku]
                for loc in locations.values():
                    d_bal = db.query(StockBalance).filter_by(item_id=d_item.id, location_id=loc.id).first()
                    if d_bal and d_bal.quantity_on_hand > 0:
                        target_qty = 1 if loc.code == "WH-01" else 0
                        needed_issue = d_bal.quantity_on_hand - target_qty
                        if needed_issue > 0:
                            d_bal.quantity_on_hand = target_qty
                            d_bal.updated_at = recent_dt
                            db.add(StockMovement(
                                item_id=d_item.id, location_id=loc.id,
                                movement_type="ISSUE", quantity=-needed_issue,
                                project_id=prj_list[0].id if prj_list else None,
                                reference_type="SYNTHETIC",
                                reason=f"Expedited overhaul consumption at {loc.code}",
                                actor_label="synthetic-seed",
                                occurred_at=recent_dt, created_at=recent_dt
                            ))
        db.commit()

    # Seed Purchase Orders
    if db.query(PurchaseOrder).count() == 0:
        item_list = list(items.values())
        supplier_list = list(suppliers.values())
        if item_list and supplier_list:
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

            if len(supplier_list) > 1 and len(item_list) > 2:
                po2 = PurchaseOrder(
                    po_number="PO-202610-002",
                    supplier_id=supplier_list[1].id,
                    status="DRAFT",
                    order_date=datetime.now(timezone.utc).isoformat(),
                    notes="Draft purchase order awaiting procurement officer review",
                )
                db.add(po2)
                db.flush()
                db.add(PurchaseOrderLine(
                    po_id=po2.id, item_id=item_list[2].id, destination_location_id=wh_loc.id,
                    qty_ordered=5, qty_received=0, unit_price_minor=item_list[2].unit_cost_minor or 280000
                ))
            db.commit()

    # Seed Document Attachments
    if db.query(DocumentAttachment).count() == 0:
        attachments_dir = os.path.realpath(settings.ATTACHMENTS_DIR)
        os.makedirs(attachments_dir, exist_ok=True)
        po_first = db.query(PurchaseOrder).first()
        item_first = db.query(Item).first()

        sample_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF"

        if po_first:
            fpath = os.path.join(attachments_dir, "po_sample_spec.pdf")
            with open(fpath, "wb") as f:
                f.write(sample_pdf_bytes)
            db.add(DocumentAttachment(
                entity_type="PURCHASE_ORDER",
                entity_id=po_first.id,
                filename="po_sample_spec.pdf",
                file_path="po_sample_spec.pdf",
                file_type="application/pdf",
                file_size_bytes=len(sample_pdf_bytes),
                description="Technical Specification & Procurement Sheet"
            ))

        if item_first:
            fpath = os.path.join(attachments_dir, "item_valve_spec.pdf")
            with open(fpath, "wb") as f:
                f.write(sample_pdf_bytes)
            db.add(DocumentAttachment(
                entity_type="ITEM",
                entity_id=item_first.id,
                filename="item_valve_spec.pdf",
                file_path="item_valve_spec.pdf",
                file_type="application/pdf",
                file_size_bytes=len(sample_pdf_bytes),
                description="Material Test Report (MTR) & OEM Certificate"
            ))
        db.commit()


def seed(profile: str = "demo", reset: bool = False, seed_value: int = 42):
    """Entry point for database seeding."""
    print("==========================================================")
    print(f"  StockSense Seeder — Profile: [{profile.upper()}] (Seed: {seed_value})")
    print("==========================================================")

    random.seed(seed_value)

    if reset:
        print("  Dropping existing schema tables...")
        Base.metadata.drop_all(bind=engine)
        print("  ✓ Schema dropped.")

    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations(engine)
    db = SessionLocal()

    try:
        if profile == "empty":
            print("✓ Empty profile selected: Database schema initialized with zero records.")
            return

        master = seed_master_data(db)
        print(f"✓ Seeded {len(master['categories'])} categories")
        print(f"✓ Seeded {len(master['locations'])} locations")
        print(f"✓ Seeded {len(master['suppliers'])} suppliers")
        print(f"✓ Seeded {len(master['projects'])} projects")
        print(f"✓ Seeded {len(master['users'])} users")

        if profile == "demo":
            seed_demo_items_and_ledger(db, master)
            print("✓ Seeded 15 items, 52-week ledger history, POs, and sample attachments.")
            report = run_integrity_check(db)
            print(f"✓ Integrity verification: {report.status} (Mismatches: {report.mismatches_count})")
            try:
                from backend.ai.service import AIService
                from backend.ai.schemas import AIRunTriggerRequest
                req = AIRunTriggerRequest(service_level=0.95, default_method="CROSTON")
                AIService.execute_ai_run(db, req)
                print("✓ Initial AI pipeline executed: Replenishment recommendations ready.")
            except Exception as e:
                print(f"ℹ AI run can be triggered from UI: {e}")

        print("==========================================================")
        print("  ✓ Database seeding successfully completed!")
        print("==========================================================")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="StockSense SQLite Database Seeder")
    parser.add_argument(
        "--profile",
        choices=["demo", "minimal", "empty"],
        default="demo",
        help="Seeding profile (demo=full oilfield, minimal=master data, empty=schema only)"
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop and recreate database tables before seeding"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=int(os.environ.get("SYNTHETIC_DATA_SEED", 42)),
        help="Random seed for deterministic generation"
    )
    args = parser.parse_args()
    seed(profile=args.profile, reset=args.reset, seed_value=args.seed)


if __name__ == "__main__":
    main()
