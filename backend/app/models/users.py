from sqlalchemy import Column, Integer, String, CheckConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint("role IN ('STOREKEEPER', 'PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN')", name="chk_user_role"),
        CheckConstraint("is_active IN (0, 1)", name="chk_user_is_active"),
    )
