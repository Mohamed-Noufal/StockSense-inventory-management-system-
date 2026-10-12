#!/usr/bin/env bash
# Quick entrypoint to run StockSense app with one command: ./run.sh
exec "$(dirname "$0")/scripts/run_app.sh" "$@"
