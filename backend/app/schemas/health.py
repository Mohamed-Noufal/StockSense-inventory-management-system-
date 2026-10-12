from typing import Dict, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class DatabaseHealth(BaseModel):
    status: str = Field(..., examples=["connected"])
    engine: str = Field(..., examples=["SQLite"])
    journal_mode: str = Field(..., examples=["wal"])
    foreign_keys: bool = Field(..., examples=[True])

class HealthResponse(BaseModel):
    status: str = Field(..., examples=["healthy"])
    version: str = Field(..., examples=["0.1.0"])
    environment: str = Field(..., examples=["development"])
    database: DatabaseHealth
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReadyResponse(BaseModel):
    status: str = Field(..., examples=["ready"])
    tables_initialized: bool = True
    table_counts: Dict[str, int]
    default_warehouse: Optional[str] = None
