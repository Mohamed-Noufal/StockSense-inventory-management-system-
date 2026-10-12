#!/usr/bin/env bash
# StockSense — Unified Application Runner (One Command)
# Starts FastAPI backend (port 8000) and React frontend (port 5173).
# Supports: ./run.sh [start | stop | restart | status]

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

COMMAND="${1:-start}"

stop_services() {
    echo "🛑 Stopping all running StockSense services..."
    pkill -f "uvicorn backend.app.main:app" 2>/dev/null && echo "  ✓ Stopped Backend (uvicorn)" || true
    pkill -f "vite" 2>/dev/null && echo "  ✓ Stopped Frontend (vite)" || true
    echo "✓ All services stopped."
}

check_status() {
    local b_up=false
    local f_up=false
    curl -s http://127.0.0.1:8000/api/v1/health > /dev/null 2>&1 && b_up=true
    curl -s http://127.0.0.1:5173 > /dev/null 2>&1 && f_up=true

    echo "=========================================================="
    echo "  StockSense Service Status Diagnostic                   "
    echo "=========================================================="
    if [ "$b_up" = true ]; then
        echo "  • Backend API:      ONLINE (http://localhost:8000)"
    else
        echo "  • Backend API:      OFFLINE"
    fi
    if [ "$f_up" = true ]; then
        echo "  • Frontend Dev UI:  ONLINE (http://localhost:5173)"
    else
        echo "  • Frontend Dev UI:  OFFLINE"
    fi
    echo "=========================================================="
}

if [ "$COMMAND" = "stop" ]; then
    stop_services
    exit 0
elif [ "$COMMAND" = "status" ]; then
    check_status
    exit 0
elif [ "$COMMAND" = "restart" ]; then
    stop_services
    sleep 1
fi

echo "=========================================================="
echo "      StockSense — Oilfield Inventory AI System           "
echo "=========================================================="

# 1. Check Python virtual environment
if [ ! -f ".venv/bin/python" ]; then
    echo "✗ Virtual environment (.venv) not found. Initializing..."
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

cleanup() {
    echo ""
    if [ -n "$BACKEND_PID" ] || [ -n "$FRONTEND_PID" ]; then
        echo "🛑 Stopping services started by this session..."
        [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
        [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
        wait 2>/dev/null || true
        echo "✓ Services stopped."
    else
        echo "ℹ Detached from monitor. Services remain ACTIVE in background."
        echo "  (To stop all background services, run: ./run.sh stop)"
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM

# 4. Check & Start FastAPI backend server
if curl -s http://127.0.0.1:8000/api/v1/health > /dev/null 2>&1; then
    echo "  ✓ Backend API is already RUNNING on http://127.0.0.1:8000"
else
    echo "  → Starting FastAPI backend on http://127.0.0.1:8000 ..."
    .venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload &
    BACKEND_PID=$!
    sleep 2
fi

# 5. Check & Start Vite frontend dev server
if curl -s http://127.0.0.1:5173 > /dev/null 2>&1; then
    echo "  ✓ Frontend Dev Server is already RUNNING on http://127.0.0.1:5173"
else
    echo "  → Starting Vite frontend on http://127.0.0.1:5173 ..."
    (cd frontend && npm run dev -- --host 127.0.0.1 --port 5173) &
    FRONTEND_PID=$!
    sleep 2
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
echo "  Press [Ctrl+C] to stop/detach. (To shut down: ./run.sh stop)"
echo "=========================================================="
echo ""

# Keep runner active in foreground so the terminal session stays open
while true; do
    sleep 2
done
