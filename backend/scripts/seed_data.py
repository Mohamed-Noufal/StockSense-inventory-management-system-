"""
StockSense Seeder Compatibility Wrapper
Delegates to backend.scripts.seed with the demo profile.
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.scripts.seed import seed as run_seed

def seed():
    seed_val = int(os.environ.get("SYNTHETIC_DATA_SEED", 42))
    run_seed(profile="demo", reset=False, seed_value=seed_val)

if __name__ == "__main__":
    seed()
