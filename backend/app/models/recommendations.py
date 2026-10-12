from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, CheckConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("ai_runs.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    destination_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    status = Column(String, nullable=False, default="OPEN")
    urgency = Column(String, nullable=False, default="NORMAL")
    on_hand = Column(Integer, nullable=False)
    on_order = Column(Integer, nullable=False)
    inventory_position = Column(Integer, nullable=False)
    reorder_point = Column(Integer, nullable=False)
    suggested_qty = Column(Integer, nullable=False)
    stockout_probability = Column(Float, nullable=True)
    expected_stockout_date = Column(String, nullable=True)
    explanation_json = Column(Text, nullable=False)
    summary_text = Column(Text, nullable=False)
    decided_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    decided_at = Column(String, nullable=True)
    decision_note = Column(Text, nullable=True)
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint("status IN ('OPEN', 'APPROVED', 'DISMISSED', 'EXPIRED')", name="chk_rec_status"),
        CheckConstraint("urgency IN ('CRITICAL', 'HIGH', 'NORMAL')", name="chk_rec_urgency"),
        CheckConstraint("suggested_qty > 0", name="chk_rec_suggested_qty_positive"),
    )
