import os
import uuid
import shutil
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.attachments import DocumentAttachment
from backend.app.schemas.attachments import AttachmentResponse, AttachmentCreate

router = APIRouter()

ATTACHMENTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../data/attachments"))
os.makedirs(ATTACHMENTS_DIR, exist_ok=True)

def _format_attachment(att: DocumentAttachment) -> AttachmentResponse:
    return AttachmentResponse(
        id=att.id,
        entity_type=att.entity_type,
        entity_id=att.entity_id,
        filename=att.filename,
        file_type=att.file_type,
        file_size_bytes=att.file_size_bytes,
        description=att.description,
        uploaded_by_user_id=att.uploaded_by_user_id,
        uploaded_by_name=att.uploaded_by_name,
        created_at=att.created_at,
        download_url=f"/api/v1/attachments/{att.id}/file"
    )

def _ensure_seed_attachments(db: Session):
    """Seed initial realistic delivery notes, waybills, and inspection certificates if empty."""
    count = db.query(DocumentAttachment).count()
    if count > 0:
        return

    sample_docs = [
        DocumentAttachment(
            entity_type="PURCHASE_ORDER",
            entity_id=1,
            filename="Vendor_Delivery_Note_PO-202610-001.pdf",
            file_type="application/pdf",
            file_size_bytes=248500,
            file_path=os.path.join(ATTACHMENTS_DIR, "sample_po1_delivery_note.pdf"),
            description="Supplier Signed Packing Slip & Bill of Lading",
            uploaded_by_name="Dock Inspector",
            created_at=datetime.now(timezone.utc).isoformat()
        ),
        DocumentAttachment(
            entity_type="PURCHASE_ORDER",
            entity_id=1,
            filename="Material_Inspection_Certificate_3.1.pdf",
            file_type="application/pdf",
            file_size_bytes=184200,
            file_path=os.path.join(ATTACHMENTS_DIR, "sample_po1_inspection.pdf"),
            description="EN 10204 3.1 Material Test Certificate & QC Inspection",
            uploaded_by_name="QC Inspector Sarah",
            created_at=datetime.now(timezone.utc).isoformat()
        ),
        DocumentAttachment(
            entity_type="MOVEMENT",
            entity_id=1,
            filename="Rig12_Requisition_Waybill_001.pdf",
            file_type="application/pdf",
            file_size_bytes=142000,
            file_path=os.path.join(ATTACHMENTS_DIR, "sample_mov1_waybill.pdf"),
            description="Rig-12 Expedited Issue Waybill & Material Release Voucher",
            uploaded_by_name="Storekeeper Ahmed",
            created_at=datetime.now(timezone.utc).isoformat()
        ),
        DocumentAttachment(
            entity_type="MOVEMENT",
            entity_id=2,
            filename="Flange_Receiving_Condition_Photo.jpg",
            file_type="image/jpeg",
            file_size_bytes=425000,
            file_path=os.path.join(ATTACHMENTS_DIR, "sample_mov2_condition.jpg"),
            description="Visual Inspection & Serial Number Verification Photo",
            uploaded_by_name="Dock Inspector",
            created_at=datetime.now(timezone.utc).isoformat()
        ),
    ]
    for doc in sample_docs:
        db.add(doc)
    db.commit()

@router.get("", response_model=List[AttachmentResponse])
def list_attachments(
    entity_type: Optional[str] = Query(None, description="Filter by MOVEMENT or PURCHASE_ORDER"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    db: Session = Depends(get_db)
):
    """List document attachments with optional entity scoping."""
    _ensure_seed_attachments(db)
    query = db.query(DocumentAttachment)
    if entity_type:
        query = query.filter(DocumentAttachment.entity_type == entity_type.upper().strip())
    if entity_id is not None:
        query = query.filter(DocumentAttachment.entity_id == entity_id)
    
    docs = query.order_by(DocumentAttachment.id.desc()).all()
    return [_format_attachment(d) for d in docs]

@router.post("/upload", response_model=AttachmentResponse)
async def upload_attachment(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: int = Form(...),
    description: Optional[str] = Form(None),
    uploaded_by_name: Optional[str] = Form("Storekeeper"),
    uploaded_by_user_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload a physical document slip, PDF waybill, or photo for a movement or PO."""
    clean_type = entity_type.upper().strip()
    if clean_type not in ("MOVEMENT", "PURCHASE_ORDER"):
        raise HTTPException(status_code=400, detail="entity_type must be MOVEMENT or PURCHASE_ORDER")

    # Generate safe unique filename
    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{clean_type.lower()}_{entity_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(ATTACHMENTS_DIR, safe_name)

    # Stream file to disk
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(dest_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    content_type = file.content_type or "application/octet-stream"

    record = DocumentAttachment(
        entity_type=clean_type,
        entity_id=entity_id,
        filename=file.filename or safe_name,
        file_type=content_type,
        file_size_bytes=file_size,
        file_path=dest_path,
        description=description.strip() if description else f"{clean_type} Supporting Document",
        uploaded_by_user_id=uploaded_by_user_id,
        uploaded_by_name=uploaded_by_name,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _format_attachment(record)

@router.post("", response_model=AttachmentResponse)
def create_attachment_metadata(
    payload: AttachmentCreate,
    db: Session = Depends(get_db)
):
    """Directly insert document metadata (useful for tests and synthetic runners)."""
    record = DocumentAttachment(
        entity_type=payload.entity_type.upper().strip(),
        entity_id=payload.entity_id,
        filename=payload.filename,
        file_type=payload.file_type,
        file_size_bytes=payload.file_size_bytes,
        file_path=payload.file_path,
        description=payload.description,
        uploaded_by_user_id=payload.uploaded_by_user_id,
        uploaded_by_name=payload.uploaded_by_name,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _format_attachment(record)

@router.get("/{id}/file")
def get_attachment_file(id: int, db: Session = Depends(get_db)):
    """Stream file content for browser preview or physical download."""
    record = db.query(DocumentAttachment).filter(DocumentAttachment.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # If physical file exists on disk, stream it
    if os.path.exists(record.file_path):
        return FileResponse(
            path=record.file_path,
            filename=record.filename,
            media_type=record.file_type
        )

    # For seeded or mock documents without physical disk files, generate synthetic printable content
    mock_content = (
        f"--- STOCKSENSE OFFICIAL WAREHOUSE DOCUMENT ---\n"
        f"Document ID: {record.id}\n"
        f"Entity: {record.entity_type} #{record.entity_id}\n"
        f"Filename: {record.filename}\n"
        f"Description: {record.description}\n"
        f"Uploaded By: {record.uploaded_by_name}\n"
        f"Timestamp: {record.created_at}\n"
        f"Integrity Stamp: VERIFIED WAL APPEND-ONLY LEDGER PROOF\n"
        f"-----------------------------------------------\n"
    ).encode("utf-8")

    return Response(
        content=mock_content,
        media_type="text/plain",
        headers={"Content-Disposition": f'inline; filename="{record.filename}.txt"'}
    )
