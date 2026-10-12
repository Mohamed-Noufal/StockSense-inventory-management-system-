from sqlalchemy import Column, Integer, String, Float, ForeignKey, CheckConstraint, UniqueConstraint
from backend.app.core.database import Base

class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("ai_runs.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    period_start = Column(String, nullable=False)
    horizon_step = Column(Integer, nullable=False)
    mean = Column(Float, nullable=False)
    p50 = Column(Float, nullable=True)
    p90 = Column(Float, nullable=True)
    method = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint("run_id", "item_id", "period_start", "horizon_step", name="uq_forecast_period"),
        CheckConstraint("horizon_step > 0", name="chk_forecast_horizon_positive"),
        CheckConstraint("mean >= 0", name="chk_forecast_mean_non_negative"),
    )
