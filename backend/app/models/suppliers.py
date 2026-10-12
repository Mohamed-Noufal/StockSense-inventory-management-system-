from sqlalchemy import Column, Integer, String, Text, CheckConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    country = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    is_import = Column(Integer, nullable=False, default=0)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint("is_import IN (0, 1)", name="chk_supplier_is_import"),
        CheckConstraint("is_active IN (0, 1)", name="chk_supplier_is_active"),
    )
