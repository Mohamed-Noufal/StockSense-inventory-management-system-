import sys
import os
import tempfile
import shutil
import pytest

# Ensure repository root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# Configure completely isolated temporary test database and attachments directory BEFORE app import
_test_tmp_dir = tempfile.mkdtemp(prefix="stocksense_test_run_")
_test_db_path = os.path.join(_test_tmp_dir, "test_stocksense.db")
_test_attachments_dir = os.path.join(_test_tmp_dir, "attachments")
os.makedirs(_test_attachments_dir, exist_ok=True)

os.environ["DATABASE_URL"] = f"sqlite:///{_test_db_path}"
os.environ["ATTACHMENTS_DIR"] = _test_attachments_dir
os.environ["ENVIRONMENT"] = "testing"

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import Base, engine, SessionLocal
from backend.app.core.config import settings
from backend.scripts.seed_data import seed

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed()
    finally:
        db.close()
    yield
    # Cleanup temporary test environment
    try:
        shutil.rmtree(_test_tmp_dir, ignore_errors=True)
    except Exception:
        pass

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
