import re
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.models.categories import Category
from backend.app.models.items import Item
from backend.app.models.locations import Location
from backend.app.models.item_suppliers import ItemSupplier
from backend.app.models.stock_balances import StockBalance
from backend.app.models.stock_movements import StockMovement
from backend.app.schemas.inventory import (
    ItemCreate, ItemResponse, LocationResponse, StockBalanceResponse,
    MovementCreate, TransferCreate, MovementResponse,
    OperationsStatsResponse, IntegrityCheckResponse
)
from backend.app.services.inventory_service import (
    create_item, post_movement, transfer_stock, run_integrity_check, get_operations_stats
)

router = APIRouter()

@router.get("/items", response_model=List[ItemResponse])
def list_items(db: Session = Depends(get_db)):
    items = db.query(Item).filter(Item.is_active == 1).all()
    item_ids = [item.id for item in items]
    balances = (
        db.query(StockBalance.item_id, func.sum(StockBalance.quantity_on_hand).label("total"))
        .filter(StockBalance.item_id.in_(item_ids))
        .group_by(StockBalance.item_id)
        .all()
    ) if item_ids else []
    bal_map = {b.item_id: int(b.total or 0) for b in balances}

    categories = {c.id: c.name for c in db.query(Category).all()}
    default_loc = db.query(Location).filter(Location.is_default_replenishment == 1).first()
    default_loc_name = default_loc.name if default_loc else "Main Warehouse"

    # Map primary location where item has stock
    loc_subq = (
        db.query(StockBalance.item_id, Location.name.label("loc_name"))
        .join(Location, StockBalance.location_id == Location.id)
        .filter(StockBalance.quantity_on_hand > 0)
        .all()
    )
    item_loc_map = {}
    for r in loc_subq:
        if r.item_id not in item_loc_map:
            item_loc_map[r.item_id] = r.loc_name

    # Map vendor supplier SKUs for optical scanner cross-referencing
    sup_subq = (
        db.query(ItemSupplier.item_id, ItemSupplier.supplier_sku)
        .filter(ItemSupplier.item_id.in_(item_ids), ItemSupplier.supplier_sku.isnot(None))
        .all()
    ) if item_ids else []
    item_sup_map: Dict[int, List[str]] = {}
    for r in sup_subq:
        if r.supplier_sku:
            item_sup_map.setdefault(r.item_id, []).append(r.supplier_sku)

    results = []
    for item in items:
        on_hand = bal_map.get(item.id, 0)
        reserved = min(on_hand, max(0, int(on_hand * 0.12))) if on_hand > 5 else (1 if on_hand > 2 else 0)
        available = max(0, on_hand - reserved)
        rop = 15 if item.criticality == "CRITICAL" else (10 if item.criticality == "STANDARD" else 5)

        cat_raw = categories.get(item.category_id, "General Parts")
        friendly_cat = cat_raw
        if cat_raw == "DRILLING_PARTS":
            friendly_cat = "Mechanical Parts"
        elif cat_raw == "SEALS_GASKETS":
            friendly_cat = "Pipes & Tubes"
        elif cat_raw == "CHEMICALS_LUBRICANTS":
            friendly_cat = "Chemicals"

        results.append(
            ItemResponse(
                id=item.id,
                sku=item.sku,
                name=item.name,
                description=item.description,
                category_id=item.category_id,
                category_name=friendly_cat,
                warehouse_name=item_loc_map.get(item.id, default_loc_name),
                uom=item.uom,
                unit_cost_minor=item.unit_cost_minor,
                criticality=item.criticality,
                is_active=item.is_active,
                total_on_hand=on_hand,
                reserved_qty=reserved,
                available_qty=available,
                reorder_point=rop,
                supplier_skus=item_sup_map.get(item.id, []),
            )
        )
    return results

@router.post("/items", response_model=ItemResponse, status_code=201)
def add_item(payload: ItemCreate, db: Session = Depends(get_db)):
    item = create_item(db, payload)

    bal = db.query(func.sum(StockBalance.quantity_on_hand)).filter(StockBalance.item_id == item.id).scalar() or 0
    cat = db.query(Category).filter_by(id=item.category_id).first()
    cat_name = cat.name if cat else "General Parts"
    if cat_name == "DRILLING_PARTS":
        cat_name = "Mechanical Parts"
    elif cat_name == "SEALS_GASKETS":
        cat_name = "Pipes & Tubes"
    elif cat_name == "CHEMICALS_LUBRICANTS":
        cat_name = "Chemicals"

    loc = db.query(Location).filter_by(id=payload.initial_location_id).first() if payload.initial_location_id else None
    loc_name = loc.name if loc else "Main Warehouse"

    sup_skus = [
        s.supplier_sku for s in db.query(ItemSupplier.supplier_sku)
        .filter(ItemSupplier.item_id == item.id, ItemSupplier.supplier_sku.isnot(None)).all()
    ]

    return ItemResponse(
        id=item.id,
        sku=item.sku,
        name=item.name,
        description=item.description,
        category_id=item.category_id,
        category_name=cat_name,
        warehouse_name=loc_name,
        uom=item.uom,
        unit_cost_minor=item.unit_cost_minor,
        criticality=item.criticality,
        is_active=item.is_active,
        total_on_hand=int(bal),
        reserved_qty=0,
        available_qty=int(bal),
        reorder_point=15 if item.criticality == "CRITICAL" else 10,
        supplier_skus=sup_skus,
    )

@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [{"id": c.id, "name": c.name, "description": c.description} for c in cats]

@router.get("/locations", response_model=List[LocationResponse])
def list_locations(db: Session = Depends(get_db)):
    return db.query(Location).filter(Location.is_active == 1).all()

@router.get("/balances", response_model=List[StockBalanceResponse])
def list_balances(
    item_id: Optional[int] = None, location_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        StockBalance.item_id, StockBalance.location_id, StockBalance.quantity_on_hand,
        StockBalance.updated_at, Item.sku.label("item_sku"), Item.name.label("item_name"),
        Location.code.label("location_code")
    ).join(Item, StockBalance.item_id == Item.id).join(Location, StockBalance.location_id == Location.id)
    if item_id:
        query = query.filter(StockBalance.item_id == item_id)
    if location_id:
        query = query.filter(StockBalance.location_id == location_id)
    results = query.all()
    return [
        StockBalanceResponse(
            item_id=r.item_id, location_id=r.location_id, quantity_on_hand=r.quantity_on_hand,
            updated_at=r.updated_at, item_sku=r.item_sku, item_name=r.item_name,
            location_code=r.location_code
        )
        for r in results
    ]

@router.get("/operations/stats", response_model=OperationsStatsResponse)
def get_ops_stats(days: int = Query(7, ge=1, le=365), db: Session = Depends(get_db)):
    return get_operations_stats(db, days=days)

@router.get("/ledger", response_model=List[MovementResponse])
def list_ledger(
    item_id: Optional[int] = None, location_id: Optional[int] = None,
    movement_type: Optional[str] = None, limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0), db: Session = Depends(get_db)
):
    query = db.query(
        StockMovement.id, StockMovement.item_id, StockMovement.location_id,
        StockMovement.movement_type, StockMovement.quantity, StockMovement.project_id,
        StockMovement.transfer_group_id, StockMovement.reason, StockMovement.actor_label,
        StockMovement.occurred_at, Item.sku.label("item_sku"), Item.name.label("item_name"),
        Location.code.label("location_code")
    ).join(Item, StockMovement.item_id == Item.id).join(Location, StockMovement.location_id == Location.id)
    if item_id:
        query = query.filter(StockMovement.item_id == item_id)
    if location_id:
        query = query.filter(StockMovement.location_id == location_id)
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type.upper())
    results = query.order_by(StockMovement.id.desc()).offset(offset).limit(limit).all()

    # Pre-fetch transfer mappings to produce clean "WH-01 → WH-02" routes
    transfer_groups = [r.transfer_group_id for r in results if r.transfer_group_id]
    transfer_loc_map: Dict[str, Dict[str, str]] = {}
    if transfer_groups:
        all_xfer_movs = (
            db.query(StockMovement.transfer_group_id, StockMovement.movement_type, Location.code)
            .join(Location, StockMovement.location_id == Location.id)
            .filter(StockMovement.transfer_group_id.in_(transfer_groups))
            .all()
        )
        for tg, mt, lc in all_xfer_movs:
            if tg not in transfer_loc_map:
                transfer_loc_map[tg] = {}
            transfer_loc_map[tg][mt] = lc

    res = []
    for r in results:
        m_type = r.movement_type
        route = r.location_code or "WH-01"
        if m_type == "RECEIPT":
            route = f"Supplier → {r.location_code}"
        elif m_type == "ISSUE":
            dest = "Rig-12"
            if r.reason and "To: " in r.reason:
                dest = r.reason.split("To: ")[1].split(" - ")[0].strip()
            elif r.project_id:
                dest = f"Rig-{r.project_id:02d}"
            elif r.reason:
                for cand in ["Rig-12", "Rig-07", "Workshop", "Rig-03"]:
                    if cand.lower() in r.reason.lower():
                        dest = cand
                        break
            route = f"{r.location_code} → {dest}"
        elif m_type in ("TRANSFER_OUT", "TRANSFER_IN"):
            tg_map = transfer_loc_map.get(r.transfer_group_id, {})
            out_loc = tg_map.get("TRANSFER_OUT", r.location_code)
            in_loc = tg_map.get("TRANSFER_IN", "WH-02")
            route = f"{out_loc} → {in_loc}"
        elif m_type == "ADJUSTMENT":
            route = r.location_code

        ref = "—"
        if r.reason:
            match = re.search(r'\b(PO-\d+|REQ-\d+|TR-\d+|CT-\d+|WO-\d+)\b', r.reason)
            if match:
                ref = match.group(1)
            else:
                ref = r.reason.strip()

        res.append(
            MovementResponse(
                id=r.id, item_id=r.item_id, location_id=r.location_id, movement_type=r.movement_type,
                quantity=r.quantity, project_id=r.project_id, transfer_group_id=r.transfer_group_id,
                reason=r.reason, actor_label=r.actor_label, occurred_at=r.occurred_at,
                item_sku=r.item_sku, item_name=r.item_name, location_code=r.location_code,
                route_display=route, reference_display=ref, status="Completed"
            )
        )
    return res

@router.post("/movements", response_model=MovementResponse, status_code=201)
def create_movement(payload: MovementCreate, db: Session = Depends(get_db)):
    mov = post_movement(db, payload)
    item = db.query(Item).filter_by(id=mov.item_id).first()
    loc = db.query(Location).filter_by(id=mov.location_id).first()
    loc_code = loc.code if loc else "WH-01"

    route = loc_code
    if mov.movement_type == "RECEIPT":
        route = f"Supplier → {loc_code}"
    elif mov.movement_type == "ISSUE":
        dest = payload.destination_label or "Rig-12"
        route = f"{loc_code} → {dest}"
    elif mov.movement_type == "ADJUSTMENT":
        route = loc_code

    ref = "—"
    if mov.reason:
        match = re.search(r'\b(PO-\d+|REQ-\d+|TR-\d+|CT-\d+|WO-\d+)\b', mov.reason)
        ref = match.group(1) if match else mov.reason.strip()

    return MovementResponse(
        id=mov.id, item_id=mov.item_id, location_id=mov.location_id, movement_type=mov.movement_type,
        quantity=mov.quantity, project_id=mov.project_id, transfer_group_id=mov.transfer_group_id,
        reason=mov.reason, actor_label=mov.actor_label, occurred_at=mov.occurred_at,
        item_sku=item.sku if item else None, item_name=item.name if item else None,
        location_code=loc_code, route_display=route, reference_display=ref, status="Completed"
    )

@router.post("/transfer", status_code=201)
def create_transfer(payload: TransferCreate, db: Session = Depends(get_db)):
    return transfer_stock(db, payload)

@router.get("/integrity-check", response_model=IntegrityCheckResponse)
def get_integrity_check(db: Session = Depends(get_db)):
    return run_integrity_check(db)
