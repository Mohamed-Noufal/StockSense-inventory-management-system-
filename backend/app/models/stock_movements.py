from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint, Index
from datetime import datetime, timezone
from backend.app.core.database import Base

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    movement_type = Column(String, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_cost_minor = Column(Integer, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    reference_type = Column(String, nullable=True)
    reference_id = Column(Integer, nullable=True)
    transfer_group_id = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    idempotency_key = Column(String, unique=True, nullable=True)
    request_fingerprint = Column(String, nullable=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_label = Column(String, nullable=False, default="system")
    occurred_at = Column(String, nullable=False, index=True)
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint(
            "movement_type IN ('RECEIPT', 'ISSUE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT')",
            name="chk_movement_type"
        ),
        CheckConstraint("quantity != 0", name="chk_movement_quantity_nonzero"),
        Index("idx_item_occurred", "item_id", "occurred_at"),
        Index("idx_location_occurred", "location_id", "occurred_at"),
        Index("idx_reference", "reference_type", "reference_id"),
    )
