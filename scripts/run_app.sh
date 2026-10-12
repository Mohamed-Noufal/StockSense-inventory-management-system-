#!/usr/bin/env bash
# StockSense — Unified Application Runner (One Command)
# Starts FastAPI backend (port 8000) and React frontend (port 5173) with port detection & clean shutdown trap.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "=========================================================="
echo "      StockSense — Oilfield Inventory AI System           "
echo "=========================================================="

# 1. Check Python virtual environment
if [ ! -f ".venv/bin/python" ]; then
    echo "✗ Virtual environment (.venv) not found."
    echo "  Creating .venv and installing dependencies..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r backend/requirements.txt
fi

# 2. Check Database initialization
if [ ! -f "data/stocksense.db" ]; then
    echo "ℹ Initializing SQLite database and seeding demo data..."
    .venv/bin/python backend/scripts/init_db.py
    .venv/bin/python backend/scripts/seed_data.py
fi

# 3. Check Frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "ℹ Installing frontend npm packages..."
    (cd frontend && npm install)
fi

echo ""
echo "🚀 Verifying and launching StockSense services..."

BACKEND_PID=""
FRONTEND_PID=""

# Cleanup trap to kill child processes started by this script on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Stopping services launched by this runner..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo "✓ Stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 4. Check & Start FastAPI backend server
if curl -s http://127.0.0.1:8000/api/v1/health > /dev/null 2>&1; then
    echo "  ✓ Backend API is already running on http://127.0.0.1:8000"
else
    echo "  → Starting FastAPI backend on http://127.0.0.1:8000 ..."
    .venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload &
    BACKEND_PID=$!
    sleep 2
fi

# 5. Check & Start Vite frontend dev server
if curl -s http://127.0.0.1:5173 > /dev/null 2>&1; then
    echo "  ✓ Frontend Dev Server is already running on http://127.0.0.1:5173"
else
    echo "  → Starting Vite frontend on http://127.0.0.1:5173 ..."
    (cd frontend && npm run dev -- --host 127.0.0.1 --port 5173) &
    FRONTEND_PID=$!
fi

echo ""
echo "=========================================================="
echo "  ✓ StockSense is fully operational!                      "
echo "=========================================================="
echo "  • Frontend UI:          http://localhost:5173"
echo "  • Backend Health:       http://localhost:8000/api/v1/health"
echo "  • Swagger API Docs:     http://localhost:8000/docs"
echo "  • ReDoc Documentation:  http://localhost:8000/redoc"
echo "=========================================================="

if [ -n "$BACKEND_PID" ] || [ -n "$FRONTEND_PID" ]; then
    echo "  Press [Ctrl+C] to stop running services."
    echo "=========================================================="
    echo ""
    wait
else
    echo "  All services are active in the background."
    echo "=========================================================="
    echo ""
fi
