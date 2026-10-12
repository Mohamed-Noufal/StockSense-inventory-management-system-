from sqlalchemy import Column, Integer, String, Text, CheckConstraint
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
