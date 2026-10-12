from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint, UniqueConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class ItemSupplier(Base):
    __tablename__ = "item_suppliers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    supplier_sku = Column(String, nullable=True)
    unit_price_minor = Column(Integer, nullable=False)
    moq = Column(Integer, nullable=False, default=1)
    order_multiple = Column(Integer, nullable=False, default=1)
    lead_time_days_nominal = Column(Integer, nullable=False)
    is_preferred = Column(Integer, nullable=False, default=0)
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        UniqueConstraint("item_id", "supplier_id", name="uq_item_supplier"),
        CheckConstraint("unit_price_minor >= 0", name="chk_item_supplier_unit_price"),
        CheckConstraint("moq >= 1", name="chk_item_supplier_moq"),
        CheckConstraint("order_multiple >= 1", name="chk_item_supplier_order_multiple"),
        CheckConstraint("lead_time_days_nominal > 0", name="chk_item_supplier_lead_time"),
        CheckConstraint("is_preferred IN (0, 1)", name="chk_item_supplier_preferred"),
    )
