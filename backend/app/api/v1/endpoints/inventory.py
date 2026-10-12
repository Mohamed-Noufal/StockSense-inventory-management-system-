from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.models.items import Item
from backend.app.models.locations import Location
from backend.app.models.stock_balances import StockBalance
from backend.app.models.stock_movements import StockMovement
from backend.app.schemas.inventory import (
    ItemResponse, LocationResponse, StockBalanceResponse,
    MovementCreate, TransferCreate, MovementResponse, IntegrityCheckResponse
)
from backend.app.services.inventory_service import post_movement, transfer_stock, run_integrity_check

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
    return [
        ItemResponse(
            id=item.id, sku=item.sku, name=item.name, description=item.description,
            category_id=item.category_id, uom=item.uom, unit_cost_minor=item.unit_cost_minor,
            criticality=item.criticality, is_active=item.is_active,
            total_on_hand=bal_map.get(item.id, 0)
        )
        for item in items
    ]

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
        StockMovement.occurred_at, Item.sku.label("item_sku"), Location.code.label("location_code")
    ).join(Item, StockMovement.item_id == Item.id).join(Location, StockMovement.location_id == Location.id)
    if item_id:
        query = query.filter(StockMovement.item_id == item_id)
    if location_id:
        query = query.filter(StockMovement.location_id == location_id)
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type.upper())
    results = query.order_by(StockMovement.id.desc()).offset(offset).limit(limit).all()
    return [
        MovementResponse(
            id=r.id, item_id=r.item_id, location_id=r.location_id, movement_type=r.movement_type,
            quantity=r.quantity, project_id=r.project_id, transfer_group_id=r.transfer_group_id,
            reason=r.reason, actor_label=r.actor_label, occurred_at=r.occurred_at,
            item_sku=r.item_sku, location_code=r.location_code
        )
        for r in results
    ]

@router.post("/movements", response_model=MovementResponse, status_code=201)
def create_movement(payload: MovementCreate, db: Session = Depends(get_db)):
    mov = post_movement(db, payload)
    item = db.query(Item).filter_by(id=mov.item_id).first()
    loc = db.query(Location).filter_by(id=mov.location_id).first()
    return MovementResponse(
        id=mov.id, item_id=mov.item_id, location_id=mov.location_id, movement_type=mov.movement_type,
        quantity=mov.quantity, project_id=mov.project_id, transfer_group_id=mov.transfer_group_id,
        reason=mov.reason, actor_label=mov.actor_label, occurred_at=mov.occurred_at,
        item_sku=item.sku if item else None, location_code=loc.code if loc else None
    )

@router.post("/transfer", status_code=201)
def create_transfer(payload: TransferCreate, db: Session = Depends(get_db)):
    return transfer_stock(db, payload)

@router.get("/integrity-check", response_model=IntegrityCheckResponse)
def get_integrity_check(db: Session = Depends(get_db)):
    return run_integrity_check(db)
