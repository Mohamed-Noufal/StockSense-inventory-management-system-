from sqlalchemy import Column, Integer, String, Float, ForeignKey, CheckConstraint, UniqueConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class ItemPolicy(Base):
    __tablename__ = "item_policies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("ai_runs.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    demand_pattern = Column(String, nullable=False)
    adi = Column(Float, nullable=True)
    cv2 = Column(Float, nullable=True)
    abc_class = Column(String, nullable=True)
    xyz_class = Column(String, nullable=True)
    selected_method = Column(String, nullable=False)
    low_confidence = Column(Integer, nullable=False, default=0)
    service_level = Column(Float, nullable=False, default=0.95)
    lead_time_mean_days = Column(Float, nullable=False)
    lead_time_p90_days = Column(Float, nullable=False)
    mean_weekly_demand = Column(Float, nullable=False)
    safety_stock = Column(Integer, nullable=False, default=0)
    reorder_point = Column(Integer, nullable=False, default=0)
    order_up_to = Column(Integer, nullable=False, default=0)
    computed_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        UniqueConstraint("run_id", "item_id", name="uq_run_item_policy"),
        CheckConstraint(
            "demand_pattern IN ('smooth', 'erratic', 'intermittent', 'lumpy', 'insufficient_history')",
            name="chk_item_policy_pattern"
        ),
        CheckConstraint("low_confidence IN (0, 1)", name="chk_item_policy_confidence"),
        CheckConstraint("service_level >= 0.50 AND service_level <= 0.999", name="chk_item_policy_service_level"),
        CheckConstraint("safety_stock >= 0", name="chk_item_policy_safety_stock"),
        CheckConstraint("reorder_point >= 0", name="chk_item_policy_rop"),
        CheckConstraint("order_up_to >= 0", name="chk_item_policy_out"),
    )
