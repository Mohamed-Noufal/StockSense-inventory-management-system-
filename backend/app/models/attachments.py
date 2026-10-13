from sqlalchemy import Column, Integer, String, ForeignKey, Index
from datetime import datetime, timezone
from backend.app.core.database import Base

class DocumentAttachment(Base):
    __tablename__ = "document_attachments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String, nullable=False, index=True)  # 'MOVEMENT', 'PURCHASE_ORDER'
    entity_id = Column(Integer, nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # 'application/pdf', 'image/png', 'image/jpeg', 'text/plain'
    file_size_bytes = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    description = Column(String, nullable=True)  # 'Vendor Delivery Note', 'Inspection Certificate', etc.
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_by_name = Column(String, nullable=True)
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        Index("idx_entity_attachment", "entity_type", "entity_id"),
    )
