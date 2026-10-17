import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import Engine
from backend.app.core.config import settings

# Ensure SQLite database directory exists
if settings.DATABASE_URL.startswith("sqlite:///"):
    db_file = settings.DATABASE_URL.replace("sqlite:///", "")
    if db_file and db_file != ":memory:":
        db_dir = os.path.dirname(os.path.abspath(db_file))
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

# SQLite engine configuration
connect_args = {"check_same_thread": False}
if "sqlite" in settings.DATABASE_URL:
    connect_args["timeout"] = settings.SQLITE_TIMEOUT

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

# Enforce SQLite PRAGMA configuration on every connection:
# 1. foreign_keys = ON (enforces relational integrity)
# 2. journal_mode = WAL (enables concurrent readers while writing)
# 3. synchronous = NORMAL (safe performance for WAL)
# 4. busy_timeout = SQLITE_TIMEOUT in ms (waits if locked)
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    timeout_ms = int(settings.SQLITE_TIMEOUT * 1000)
    cursor.execute(f"PRAGMA busy_timeout={timeout_ms};")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def ensure_schema_migrations(engine_obj):
    """Auto-migrate missing columns for backward-compatible upgrades on existing SQLite files."""
    try:
        with engine_obj.connect() as conn:
            res = conn.exec_driver_sql("PRAGMA table_info(users)")
            cols = [row[1] for row in res.fetchall()]
            if cols and "hashed_password" not in cols:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN hashed_password VARCHAR")
                conn.commit()
    except Exception:
        pass

def get_db():
    """Dependency that yields a database session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
