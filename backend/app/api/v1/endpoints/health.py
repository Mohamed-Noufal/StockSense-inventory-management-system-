from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from backend.app.core.database import get_db, engine
from backend.app.core.config import settings
from backend.app.schemas.health import HealthResponse, DatabaseHealth, ReadyResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)):
    """
    Check application and database health, verifying SQLite WAL mode and foreign key enforcement.
    """
    try:
        # Check basic connectivity
        db.execute(text("SELECT 1"))
        
        # Check SQLite pragmas
        fk_result = db.execute(text("PRAGMA foreign_keys")).scalar()
        wal_result = db.execute(text("PRAGMA journal_mode")).scalar()
        
        db_health = DatabaseHealth(
            status="connected",
            engine="SQLite",
            journal_mode=str(wal_result).lower() if wal_result else "unknown",
            foreign_keys=bool(fk_result == 1),
        )
        
        return HealthResponse(
            status="healthy",
            version="0.1.0",
            environment=settings.ENVIRONMENT,
            database=db_health,
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connectivity check failed: {str(e)}",
        )

@router.get("/ready", response_model=ReadyResponse)
def get_readiness(db: Session = Depends(get_db)):
    """
    Check system readiness, including table initialization and default warehouse configuration.
    """
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        
        table_counts = {}
        for table in table_names:
            try:
                count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                table_counts[table] = count or 0
            except Exception:
                table_counts[table] = 0
                
        return ReadyResponse(
            status="ready",
            tables_initialized=len(table_names) > 0,
            table_counts=table_counts,
            default_warehouse=settings.DEFAULT_WAREHOUSE_CODE,
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Readiness check failed: {str(e)}",
        )
