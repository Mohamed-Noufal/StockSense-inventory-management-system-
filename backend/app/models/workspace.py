from sqlalchemy import Column, String
from datetime import datetime, timezone
from backend.app.core.database import Base

class WorkspaceSetting(Base):
    __tablename__ = "workspace_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
    updated_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
