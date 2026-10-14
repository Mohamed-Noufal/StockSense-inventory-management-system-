#!/usr/bin/env bash
# StockSense — Docker Backend Entrypoint Script
set -e

echo "=========================================================="
echo "  StockSense — Initializing Container Environment        "
echo "=========================================================="

# Ensure data directory and attachments subfolder exist
mkdir -p /app/data/attachments

# Initialize and seed database if not already present
DB_PATH="${SQLITE_DATABASE_PATH:-data/stocksense.db}"
if [ ! -f "$DB_PATH" ]; then
    echo "ℹ Database not found at $DB_PATH. Running auto-initialization..."
    python backend/scripts/init_db.py
    echo "ℹ Seeding initial operational master data and history..."
    python backend/scripts/seed_data.py
    echo "✓ Database initialization and seeding complete."
else
    echo "✓ Existing database detected at $DB_PATH."
fi

echo "🚀 Starting StockSense backend service..."
exec "$@"
