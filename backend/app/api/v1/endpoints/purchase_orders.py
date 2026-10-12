from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.purchase_orders import PurchaseOrder, PurchaseOrderLine
from backend.app.models.suppliers import Supplier
from backend.app.models.items import Item
from backend.app.models.locations import Location
from backend.app.schemas.purchase_orders import (
    POCreate, POReceivePayload, POResponse, POLineResponse, SupplierResponse
)
from backend.app.services.procurement_service import (
    create_po, approve_po, receive_po_line, cancel_po
)

router = APIRouter()

def _format_po(po: PurchaseOrder, db: Session) -> POResponse:
    supplier = db.query(Supplier).filter_by(id=po.supplier_id).first()
    lines = db.query(PurchaseOrderLine).filter_by(po_id=po.id).all()
    line_responses = []
    total_amount = 0
    for l in lines:
        item = db.query(Item).filter_by(id=l.item_id).first()
        loc = db.query(Location).filter_by(id=l.destination_location_id).first()
        rem = max(0, l.qty_ordered - l.qty_received)
        total_amount += l.qty_ordered * l.unit_price_minor
        line_responses.append(POLineResponse(
            id=l.id, po_id=l.po_id, item_id=l.item_id,
            destination_location_id=l.destination_location_id,
            qty_ordered=l.qty_ordered, qty_received=l.qty_received,
            remaining_quantity=rem, unit_price_minor=l.unit_price_minor,
            created_at=l.created_at, item_sku=item.sku if item else None,
            item_name=item.name if item else None,
            location_code=loc.code if loc else None
        ))
    return POResponse(
        id=po.id, po_number=po.po_number, supplier_id=po.supplier_id,
        supplier_name=supplier.name if supplier else None,
        status=po.status, created_at=po.created_at,
        order_date=po.order_date, expected_date=po.expected_date,
        notes=po.notes, lines=line_responses,
        total_lines=len(line_responses), total_amount_minor=total_amount
    )

@router.get("", response_model=List[POResponse])
def list_purchase_orders(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PurchaseOrder)
    if status:
        query = query.filter(PurchaseOrder.status == status.upper())
    pos = query.order_by(PurchaseOrder.id.desc()).all()
    return [_format_po(po, db) for po in pos]

@router.get("/suppliers", response_model=List[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).filter(Supplier.is_active == 1).order_by(Supplier.name).all()

@router.get("/{id}", response_model=POResponse)
def get_purchase_order(id: int, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrder).filter_by(id=id).first()
    if not po:
        raise HTTPException(status_code=404, detail=f"Purchase order {id} not found")
    return _format_po(po, db)

@router.post("", response_model=POResponse, status_code=201)
def create_purchase_order(payload: POCreate, db: Session = Depends(get_db)):
    po = create_po(db, payload)
    return _format_po(po, db)

@router.post("/{id}/approve", response_model=POResponse)
def approve_purchase_order(id: int, db: Session = Depends(get_db)):
    po = approve_po(db, id)
    return _format_po(po, db)

@router.post("/{id}/receive", response_model=POResponse)
def receive_goods(id: int, payload: POReceivePayload, db: Session = Depends(get_db)):
    po = receive_po_line(db, id, payload)
    return _format_po(po, db)

@router.post("/{id}/cancel", response_model=POResponse)
def cancel_purchase_order(id: int, db: Session = Depends(get_db)):
    po = cancel_po(db, id)
    return _format_po(po, db)
