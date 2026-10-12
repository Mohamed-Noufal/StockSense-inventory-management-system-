from sqlalchemy import Column, Integer, String, Text, ForeignKey, CheckConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sku = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    uom = Column(String, nullable=False, default="pcs")
    unit_cost_minor = Column(Integer, nullable=False, default=0)
    criticality = Column(String, nullable=False, default="STANDARD")
    shelf_life_days = Column(Integer, nullable=True)
    is_active = Column(Integer, nullable=False, default=1)
    introduced_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint("unit_cost_minor >= 0", name="chk_item_unit_cost_positive"),
        CheckConstraint("criticality IN ('CRITICAL', 'STANDARD', 'LOW')", name="chk_item_criticality"),
        CheckConstraint("is_active IN (0, 1)", name="chk_item_is_active"),
    )
