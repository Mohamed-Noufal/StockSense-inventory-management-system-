from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class StockBalance(Base):
    __tablename__ = "stock_balances"

    item_id = Column(Integer, ForeignKey("items.id"), primary_key=True, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), primary_key=True, nullable=False)
    quantity_on_hand = Column(Integer, nullable=False, default=0)
    updated_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint("quantity_on_hand >= 0", name="chk_stock_balance_non_negative"),
    )
