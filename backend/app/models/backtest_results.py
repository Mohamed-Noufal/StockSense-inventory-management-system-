from sqlalchemy import Column, Integer, String, Float, ForeignKey, CheckConstraint
from backend.app.core.database import Base

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
