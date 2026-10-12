import os
import sys

# Ensure repository root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy import text, inspect
from backend.app.core.database import engine, Base, SessionLocal
import backend.app.models

def init_db():
    print("Initializing StockSense SQLite Database...")
    
    # Create all tables defined in models
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check SQLite Pragmas
        fk = db.execute(text("PRAGMA foreign_keys")).scalar()
        wal = db.execute(text("PRAGMA journal_mode")).scalar()
        print(f"✓ SQLite PRAGMA foreign_keys: {fk} (1 = ON)")
        print(f"✓ SQLite PRAGMA journal_mode: {wal}")
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"✓ Total initialized tables: {len(tables)}")
        for t in sorted(tables):
            print(f"   - {t}")
            
        print("StockSense database successfully initialized!")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
