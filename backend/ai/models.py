from sqlalchemy import (
    Column, Integer, String, Float, Text, ForeignKey,
    CheckConstraint, UniqueConstraint
)
from datetime import datetime, timezone
from backend.app.core.database import Base

class AIRun(Base):
    __tablename__ = "ai_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_type = Column(String, nullable=False, default="FORECAST_AND_POLICY")
    status = Column(String, nullable=False, default="RUNNING")
    started_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    finished_at = Column(String, nullable=True)
    data_cutoff = Column(String, nullable=False)
    random_seed = Column(Integer, nullable=False, default=42)
    params_json = Column(Text, nullable=False)
    metrics_json = Column(Text, nullable=True)
    model_version = Column(String, nullable=False, default="0.1.0")
    error = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('RUNNING', 'SUCCEEDED', 'FAILED')", name="chk_ai_run_status"),
    )

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

class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("ai_runs.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    method = Column(String, nullable=False)
    evaluation_start = Column(String, nullable=False)
    evaluation_end = Column(String, nullable=False)
    rmsse = Column(Float, nullable=True)
    mase = Column(Float, nullable=True)
    bias = Column(Float, nullable=True)
    pinball_p90 = Column(Float, nullable=True)
    cumulative_abs_error = Column(Float, nullable=True)
    n_windows = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        CheckConstraint("n_windows > 0", name="chk_backtest_n_windows"),
    )

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
