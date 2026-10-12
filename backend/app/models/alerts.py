from sqlalchemy import Column, Integer, String, Text, ForeignKey, CheckConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False, default="WARNING")
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    movement_id = Column(Integer, ForeignKey("stock_movements.id"), nullable=True)
    source_run_id = Column(Integer, ForeignKey("ai_runs.id"), nullable=True)
    message = Column(Text, nullable=False)
    details_json = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="OPEN")
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    acknowledged_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(String, nullable=True)
    resolved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(String, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "alert_type IN ('LOW_STOCK', 'STOCKOUT_RISK', 'ANOMALOUS_ISSUE', 'SUSPICIOUS_ADJUSTMENT', 'OVERSTOCK', 'NO_SUPPLIER')",
            name="chk_alert_type"
        ),
        CheckConstraint("severity IN ('INFO', 'WARNING', 'CRITICAL')", name="chk_alert_severity"),
        CheckConstraint("status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')", name="chk_alert_status"),
    )
