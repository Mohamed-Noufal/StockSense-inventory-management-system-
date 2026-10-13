import uuid
from datetime import datetime, timezone
from backend.app.core.database import SessionLocal
from backend.app.models.items import Item
from backend.app.models.locations import Location
from backend.app.models.stock_balances import StockBalance
from backend.app.models.stock_movements import StockMovement
from backend.app.services.integrity_service import run_integrity_check

def seed_operations():
    db = SessionLocal()
    try:
        # 1. Ensure WH-02 and WH-03 locations exist
        wh02 = db.query(Location).filter_by(code="WH-02").first()
        if not wh02:
            wh02 = Location(code="WH-02", name="Warehouse 02 - Transit Bay", location_type="WAREHOUSE", is_default_replenishment=0, is_active=1)
            db.add(wh02)
            db.flush()

        wh03 = db.query(Location).filter_by(code="WH-03").first()
        if not wh03:
            wh03 = Location(code="WH-03", name="Warehouse 03 - Field Staging", location_type="WAREHOUSE", is_default_replenishment=0, is_active=1)
            db.add(wh03)
            db.flush()

        loc_map = {l.code: l.id for l in db.query(Location).all()}
        item_map = {i.sku: i.id for i in db.query(Item).all()}

        wh01_id = loc_map["WH-01"]
        wh02_id = loc_map["WH-02"]
        wh03_id = loc_map["WH-03"]

        print(f"Location IDs: WH-01={wh01_id}, WH-02={wh02_id}, WH-03={wh03_id}")

        # The 8 canonical operations matching the mock screenshot:
        # 1. Oct 15, 2026 09:42 AM | Receipt | Hydraulic Pump (HP-001) | +10 | Supplier -> WH-01 | PO-1042
        # 2. Oct 15, 2026 08:17 AM | Issue | Drill Bit 3/4" (DB-034) | -5 | WH-01 -> Rig-12 | REQ-0034
        # 3. Oct 14, 2026 04:21 PM | Transfer | Pressure Valve (PV-042) | -3 | WH-01 -> WH-02 | TR-0078
        # 4. Oct 14, 2026 11:03 AM | Adjustment | Lubricant Oil 5L (LO-005) | +2 | WH-02 | CT-0012
        # 5. Oct 13, 2026 03:56 PM | Issue | Filter Cartridge (FC-012) | -8 | WH-01 -> Workshop | REQ-0031
        # 6. Oct 12, 2026 10:24 AM | Receipt | Gasket Set (GS-018) | +20 | Supplier -> WH-01 | PO-1038
        # 7. Oct 11, 2026 02:17 PM | Transfer | Safety Helmet (SH-009) | -12 | WH-02 -> WH-03 | TR-0072
        # 8. Oct 10, 2026 09:13 AM | Issue | Electric Motor (EM-022) | -1 | WH-01 -> Rig-07 | REQ-0028

        # Prior receipt baselines so issues and transfers don't result in negative stock before the operation
        # For each item, clean movements with reason starting with "MOCK_OP_"
        target_skus = ["HP-001", "DB-034", "PV-042", "LO-005", "FC-012", "GS-018", "SH-009", "EM-022"]
        for sku in target_skus:
            if sku in item_map:
                itm_id = item_map[sku]
                db.query(StockMovement).filter(StockMovement.item_id == itm_id).delete()

        # Seed realistic history including the 8 canonical operations:
        xfer1_gid = str(uuid.uuid4())
        xfer2_gid = str(uuid.uuid4())

        operations = [
            # EM-022 (Electric Motor)
            (item_map["EM-022"], wh01_id, "RECEIPT", 5, "PO-1010 - Initial stock", "Storekeeper", "2026-10-01T08:00:00Z"),
            (item_map["EM-022"], wh01_id, "ISSUE", -1, "To: Rig-07 - REQ-0028 drive replacement", "Storekeeper", "2026-10-10T09:13:00Z"),

            # SH-009 (Safety Helmet)
            (item_map["SH-009"], wh02_id, "RECEIPT", 50, "PO-1005 - Safety consignment", "Storekeeper", "2026-10-02T10:00:00Z"),
            (item_map["SH-009"], wh02_id, "TRANSFER_OUT", -12, "TR-0072 - Field crew staging", "Storekeeper", "2026-10-11T14:17:00Z", xfer2_gid),
            (item_map["SH-009"], wh03_id, "TRANSFER_IN", 12, "TR-0072 - Field crew staging", "Storekeeper", "2026-10-11T14:17:00Z", xfer2_gid),

            # GS-018 (Gasket Set)
            (item_map["GS-018"], wh01_id, "RECEIPT", 20, "PO-1038 - Batch delivery", "Storekeeper", "2026-10-12T10:24:00Z"),

            # FC-012 (Filter Cartridge)
            (item_map["FC-012"], wh01_id, "RECEIPT", 40, "PO-1015 - Filtration resupply", "Storekeeper", "2026-10-03T11:00:00Z"),
            (item_map["FC-012"], wh01_id, "ISSUE", -8, "To: Workshop - REQ-0031 maintenance overhaul", "Storekeeper", "2026-10-13T15:56:00Z"),

            # LO-005 (Lubricant Oil 5L)
            (item_map["LO-005"], wh02_id, "RECEIPT", 25, "PO-1020 - Lubricant batch", "Storekeeper", "2026-10-04T09:00:00Z"),
            (item_map["LO-005"], wh02_id, "ADJUSTMENT", 2, "CT-0012 - Cycle count surplus", "Storekeeper", "2026-10-14T11:03:00Z"),

            # PV-042 (Pressure Valve)
            (item_map["PV-042"], wh01_id, "RECEIPT", 15, "PO-1022 - Valve inventory", "Storekeeper", "2026-10-05T14:00:00Z"),
            (item_map["PV-042"], wh01_id, "TRANSFER_OUT", -3, "TR-0078 - Inter-warehouse transfer", "Storekeeper", "2026-10-14T16:21:00Z", xfer1_gid),
            (item_map["PV-042"], wh02_id, "TRANSFER_IN", 3, "TR-0078 - Inter-warehouse transfer", "Storekeeper", "2026-10-14T16:21:00Z", xfer1_gid),

            # DB-034 (Drill Bit 3/4")
            (item_map["DB-034"], wh01_id, "RECEIPT", 20, "PO-1025 - Drill bits delivery", "Storekeeper", "2026-10-06T10:30:00Z"),
            (item_map["DB-034"], wh01_id, "ISSUE", -5, "To: Rig-12 - REQ-0034 drilling batch", "Storekeeper", "2026-10-15T08:17:00Z"),

            # HP-001 (Hydraulic Pump)
            (item_map["HP-001"], wh01_id, "RECEIPT", 10, "PO-1042 - Initial shipment", "Storekeeper", "2026-10-15T09:42:00Z"),
        ]

        for op in operations:
            item_id = op[0]
            loc_id = op[1]
            m_type = op[2]
            qty = op[3]
            reason = op[4]
            actor = op[5]
            occ_at = op[6]
            x_gid = op[7] if len(op) > 7 else None

            mov = StockMovement(
                item_id=item_id,
                location_id=loc_id,
                movement_type=m_type,
                quantity=qty,
                reason=reason,
                transfer_group_id=x_gid,
                actor_label=actor,
                occurred_at=occ_at,
                created_at=occ_at
            )
            db.add(mov)

        db.flush()

        # Reconcile StockBalance for all affected items and locations
        for sku in target_skus:
            if sku in item_map:
                itm_id = item_map[sku]
                # Delete old balances for this item
                db.query(StockBalance).filter_by(item_id=itm_id).delete()
                # Compute exact sums per location
                from sqlalchemy import func
                loc_sums = (
                    db.query(StockMovement.location_id, func.sum(StockMovement.quantity).label("total"))
                    .filter(StockMovement.item_id == itm_id)
                    .group_by(StockMovement.location_id)
                    .all()
                )
                for loc_id, total in loc_sums:
                    bal = StockBalance(
                        item_id=itm_id,
                        location_id=loc_id,
                        quantity_on_hand=int(total),
                        updated_at=datetime.now(timezone.utc).isoformat()
                    )
                    db.add(bal)

        db.commit()
        print("Canonical operations successfully seeded!")

        # Run integrity check
        check = run_integrity_check(db)
        print("Integrity check result:", check)
        assert check.mismatches_count == 0, f"Integrity check failed: {check.mismatches}"
        print("ZERO MISMATCHES CONFIRMED! 100% Ledger integrity preserved.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_operations()
