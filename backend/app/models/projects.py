from sqlalchemy import Column, Integer, String, CheckConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    rig_name = Column(String, nullable=True)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=True)
    status = Column(String, nullable=False, default="PLANNED")
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint("status IN ('PLANNED', 'ACTIVE', 'COMPLETED')", name="chk_project_status"),
    )
