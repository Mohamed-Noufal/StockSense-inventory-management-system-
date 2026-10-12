from sqlalchemy import Column, Integer, String, Text, ForeignKey, CheckConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    po_number = Column(String, unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    status = Column(String, nullable=False, default="DRAFT")
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    order_date = Column(String, nullable=True)
    expected_date = Column(String, nullable=True)
    source_recommendation_id = Column(Integer, ForeignKey("recommendations.id"), unique=True, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint(
            "status IN ('DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')",
            name="chk_po_status"
        ),
    )

class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    destination_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    qty_ordered = Column(Integer, nullable=False)
    qty_received = Column(Integer, nullable=False, default=0)
    unit_price_minor = Column(Integer, nullable=False)
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint("qty_ordered > 0", name="chk_po_line_qty_ordered"),
        CheckConstraint("qty_received >= 0", name="chk_po_line_qty_received_nonneg"),
        CheckConstraint("qty_received <= qty_ordered", name="chk_po_line_qty_received_le_ordered"),
        CheckConstraint("unit_price_minor >= 0", name="chk_po_line_unit_price"),
    )
