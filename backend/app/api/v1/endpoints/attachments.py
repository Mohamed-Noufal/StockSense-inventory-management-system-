import os
import uuid
import logging
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.attachments import DocumentAttachment
from backend.app.schemas.attachments import AttachmentResponse

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
}

def _validate_magic_bytes(ext: str, header: bytes) -> bool:
    """Validate that file header matches its claimed extension."""
    if ext == ".pdf":
        return header.startswith(b"%PDF")
    elif ext == ".png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    elif ext in (".jpg", ".jpeg"):
        return header.startswith(b"\xff\xd8\xff")
    elif ext == ".webp":
        return len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP"
    return False

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

@router.get("", response_model=List[AttachmentResponse])
def list_attachments(
    entity_type: Optional[str] = Query(None, description="Filter by MOVEMENT or PURCHASE_ORDER"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    db: Session = Depends(get_db)
):
    """List document attachments with optional entity scoping. (Read-only; never mutates state)."""
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
    """
    Safely upload a physical document slip, PDF waybill, or photo for a movement or PO.
    Enforces strict MIME validation, magic-byte inspection, file size limits, and path isolation.
    """
    clean_type = entity_type.upper().strip()
    if clean_type not in ("MOVEMENT", "PURCHASE_ORDER"):
        raise HTTPException(status_code=400, detail="entity_type must be MOVEMENT or PURCHASE_ORDER")

    # Extension allowlist check
    raw_filename = file.filename or "upload"
    ext = os.path.splitext(raw_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{ext}' not allowed. Permitted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # MIME type check
    content_type = (file.content_type or "application/octet-stream").lower().split(";")[0].strip()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Content-Type '{content_type}' not allowed. Permitted: PDF and images (PNG, JPEG, WebP)"
        )

    # Magic byte check on first 512 bytes
    try:
        header = await file.read(512)
        await file.seek(0)
    except Exception as e:
        logger.error("Failed to read upload stream: %s", e)
        raise HTTPException(status_code=400, detail="Unable to read uploaded file")

    if not _validate_magic_bytes(ext, header):
        raise HTTPException(
            status_code=400,
            detail=f"File content signature does not match claimed file extension '{ext}'"
        )

    # Ensure attachments directory exists
    os.makedirs(settings.ATTACHMENTS_DIR, exist_ok=True)

    # Generate safe unique destination filename strictly inside settings.ATTACHMENTS_DIR
    safe_name = f"{clean_type.lower()}_{entity_id}_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join(settings.ATTACHMENTS_DIR, safe_name)

    # Stream file to disk with strict size limit
    total_bytes = 0
    chunk_size = 64 * 1024  # 64 KB
    try:
        with open(dest_path, "wb") as buffer:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE_BYTES:
                    buffer.close()
                    if os.path.exists(dest_path):
                        os.remove(dest_path)
                    raise HTTPException(
                        status_code=413,
                        detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB"
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        logger.error("Failed to write attachment file to disk: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save attachment file")

    # Record document metadata
    record = DocumentAttachment(
        entity_type=clean_type,
        entity_id=entity_id,
        filename=os.path.basename(raw_filename),
        file_type=content_type,
        file_size_bytes=total_bytes,
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

@router.get("/{id}/file")
def get_attachment_file(id: int, db: Session = Depends(get_db)):
    """
    Stream verified file content for browser preview or download.
    Strictly verifies that target file is located within ATTACHMENTS_DIR to prevent path traversal.
    """
    record = db.query(DocumentAttachment).filter(DocumentAttachment.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attachment not found")

    real_dest = os.path.realpath(record.file_path)
    real_base = os.path.realpath(settings.ATTACHMENTS_DIR)

    # Path traversal guard
    if not (real_dest.startswith(real_base + os.sep) or real_dest == real_base):
        logger.warning("Path traversal attempt detected on attachment %d: %s", id, record.file_path)
        raise HTTPException(status_code=403, detail="Access denied: file path outside permitted directory")

    if not os.path.exists(real_dest):
        raise HTTPException(status_code=404, detail="Attachment physical file not found on disk")

    safe_filename = os.path.basename(record.filename).replace('"', '')
    headers = {
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": f'inline; filename="{safe_filename}"',
    }

    return FileResponse(
        path=real_dest,
        filename=safe_filename,
        media_type=record.file_type or "application/octet-stream",
        headers=headers,
    )
