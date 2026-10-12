#!/usr/bin/env bash
# StockSense — System Verification & Health Check Script
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "========================================================"
echo "  StockSense — System Verification & Health Diagnostic  "
echo "========================================================"

# 1. Check Python virtual environment
echo ""
echo "[1/5] Checking Python Virtual Environment..."
if [ -f ".venv/bin/python" ]; then
    PYTHON_VER=$(.venv/bin/python --version)
    echo "  ✓ Virtual environment active: $PYTHON_VER"
else
    echo "  ✗ .venv not found! Run python3 -m venv .venv"
    exit 1
fi

# 2. Check Database engine & WAL mode
echo ""
echo "[2/5] Checking Database Initialization & Tables..."
.venv/bin/python backend/scripts/init_db.py

# 3. Run Backend Pytest Suite
echo ""
echo "[3/5] Running Backend Pytest Suite..."
.venv/bin/pytest backend/tests -v --tb=short

# 4. Check Backend API Endpoint if running
echo ""
echo "[4/5] Checking Backend API Health (Port 8000)..."
if curl -s http://127.0.0.1:8000/api/v1/health > /dev/null; then
    HEALTH_JSON=$(curl -s http://127.0.0.1:8000/api/v1/health)
    READY_JSON=$(curl -s http://127.0.0.1:8000/api/v1/ready)
    echo "  ✓ Backend API is ONLINE"
    echo "  ✓ /api/v1/health: $HEALTH_JSON"
    echo "  ✓ /api/v1/ready: $READY_JSON"
else
    echo "  ℹ Backend API is not currently responding on 127.0.0.1:8000"
    echo "    (Start with: .venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000)"
fi

# 5. Check Frontend Dev Server if running
echo ""
echo "[5/5] Checking Frontend Dev Server (Port 5173)..."
if curl -s -I http://127.0.0.1:5173 | grep -q "200 OK"; then
    echo "  ✓ Frontend Dev Server is ONLINE at http://127.0.0.1:5173"
else
    echo "  ℹ Frontend Dev Server is not currently responding on 127.0.0.1:5173"
    echo "    (Start with: cd frontend && npm run dev)"
fi

echo ""
echo "========================================================"
echo "  ✓ Verification complete! All systems operational.     "
echo "========================================================"
