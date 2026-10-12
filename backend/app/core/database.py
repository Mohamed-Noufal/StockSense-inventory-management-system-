import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import Engine
from backend.app.core.config import settings

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# SQLite engine configuration
# check_same_thread=False allows FastAPI multi-threaded requests
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Enforce SQLite PRAGMA configuration on every connection:
# 1. foreign_keys = ON (enforces relational integrity)
# 2. journal_mode = WAL (enables concurrent readers while writing)
# 3. synchronous = NORMAL (safe performance for WAL)
# 4. busy_timeout = 5000 (waits up to 5s if locked)
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.execute("PRAGMA busy_timeout=5000;")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency that yields a database session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
