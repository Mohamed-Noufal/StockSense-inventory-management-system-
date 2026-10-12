from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app.models.purchase_orders import PurchaseOrder, PurchaseOrderLine
from backend.app.models.suppliers import Supplier
from backend.app.models.items import Item
from backend.app.models.locations import Location
from backend.app.schemas.purchase_orders import POCreate, POReceivePayload
from backend.app.schemas.inventory import MovementCreate
from backend.app.services.inventory_service import post_movement

def _next_po_number(db: Session) -> str:
    count = db.query(PurchaseOrder).count() + 1
    now = datetime.now(timezone.utc)
    return f"PO-{now.strftime('%Y%m')}-{count:03d}"

def create_po(db: Session, po_in: POCreate, user_id: Optional[int] = None) -> PurchaseOrder:
    supplier = db.query(Supplier).filter_by(id=po_in.supplier_id).first()
    if not supplier or not supplier.is_active:
        raise HTTPException(status_code=404, detail=f"Active supplier ID {po_in.supplier_id} not found")

    po_number = po_in.po_number or _next_po_number(db)
    if db.query(PurchaseOrder).filter_by(po_number=po_number).first():
        raise HTTPException(status_code=400, detail=f"PO number '{po_number}' already exists")

    po = PurchaseOrder(
        po_number=po_number,
        supplier_id=po_in.supplier_id,
        status="DRAFT",
        expected_date=po_in.expected_date,
        source_recommendation_id=po_in.source_recommendation_id,
        created_by_user_id=user_id,
        notes=po_in.notes,
    )
    db.add(po)
    db.flush()

    for line_in in po_in.lines:
        item = db.query(Item).filter_by(id=line_in.item_id).first()
        if not item or not item.is_active:
            raise HTTPException(status_code=404, detail=f"Active item ID {line_in.item_id} not found")
        loc = db.query(Location).filter_by(id=line_in.destination_location_id).first()
        if not loc or not loc.is_active:
            raise HTTPException(status_code=404, detail=f"Active location ID {line_in.destination_location_id} not found")
        
        line = PurchaseOrderLine(
            po_id=po.id,
            item_id=line_in.item_id,
            destination_location_id=line_in.destination_location_id,
            qty_ordered=line_in.qty_ordered,
            qty_received=0,
            unit_price_minor=line_in.unit_price_minor,
        )
        db.add(line)

    db.commit()
    db.refresh(po)
    return po

def approve_po(db: Session, po_id: int, user_id: Optional[int] = None) -> PurchaseOrder:
    po = db.query(PurchaseOrder).filter_by(id=po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail=f"Purchase order {po_id} not found")
    if po.status != "DRAFT":
        raise HTTPException(status_code=400, detail=f"Cannot approve PO in '{po.status}' status (must be DRAFT)")

    now_iso = datetime.now(timezone.utc).isoformat()
    po.status = "APPROVED"
    po.order_date = now_iso
    po.approved_at = now_iso
    po.approved_by_user_id = user_id
    po.updated_at = now_iso
    db.commit()
    db.refresh(po)
    return po

def receive_po_line(db: Session, po_id: int, payload: POReceivePayload) -> PurchaseOrder:
    po = db.query(PurchaseOrder).filter_by(id=po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail=f"Purchase order {po_id} not found")
    if po.status not in ("APPROVED", "PARTIALLY_RECEIVED"):
        raise HTTPException(status_code=400, detail=f"Cannot receive against PO in '{po.status}' status")

    line = db.query(PurchaseOrderLine).filter_by(id=payload.po_line_id, po_id=po_id).first()
    if not line:
        raise HTTPException(status_code=404, detail=f"PO line {payload.po_line_id} not found on PO {po_id}")

    remaining = line.qty_ordered - line.qty_received
    if payload.quantity_received > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Over-receipt rejected: requested {payload.quantity_received} units, but only {remaining} remain."
        )

    dest_loc = payload.destination_location_id or line.destination_location_id
    m_in = MovementCreate(
        item_id=line.item_id,
        location_id=dest_loc,
        movement_type="RECEIPT",
        quantity=payload.quantity_received,
        reference_type="PO_LINE",
        reference_id=line.id,
        reason=f"Receipt against {po.po_number}",
        idempotency_key=payload.idempotency_key,
        actor_label=payload.actor_label,
    )
    post_movement(db, m_in, commit=False)

    line.qty_received += payload.quantity_received
    all_lines = db.query(PurchaseOrderLine).filter_by(po_id=po_id).all()
    all_done = all(l.qty_received >= l.qty_ordered for l in all_lines)
    po.status = "RECEIVED" if all_done else "PARTIALLY_RECEIVED"
    po.updated_at = datetime.now(timezone.utc).isoformat()

    db.commit()
    db.refresh(po)
    return po

def cancel_po(db: Session, po_id: int, user_id: Optional[int] = None) -> PurchaseOrder:
    po = db.query(PurchaseOrder).filter_by(id=po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail=f"Purchase order {po_id} not found")
    if po.status == "CANCELLED":
        return po
    lines = db.query(PurchaseOrderLine).filter_by(po_id=po_id).all()
    if any(l.qty_received > 0 for l in lines):
        raise HTTPException(status_code=400, detail="Cannot cancel PO with received goods.")

    po.status = "CANCELLED"
    po.updated_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(po)
    return po
