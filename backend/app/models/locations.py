from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    location_type = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    is_default_replenishment = Column(Integer, nullable=False, default=0)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint("location_type IN ('WAREHOUSE', 'YARD', 'RIG_SITE')", name="chk_location_type"),
        CheckConstraint("is_default_replenishment IN (0, 1)", name="chk_location_default_replenishment"),
        CheckConstraint("is_active IN (0, 1)", name="chk_location_is_active"),
    )
