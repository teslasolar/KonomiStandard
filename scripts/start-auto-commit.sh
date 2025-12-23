#!/bin/bash

# Start the auto-commit service in the background

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/auto-commit.log"
PID_FILE="/tmp/auto-commit.pid"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "Auto-commit service is already running (PID: $OLD_PID)"
        echo "To stop it, run: ./scripts/stop-auto-commit.sh"
        exit 1
    fi
fi

# Start the service in the background
nohup "$SCRIPT_DIR/auto-commit.sh" > "$LOG_FILE" 2>&1 &
PID=$!

echo $PID > "$PID_FILE"

echo "✓ Auto-commit service started (PID: $PID)"
echo "Logs: $LOG_FILE"
echo ""
echo "To view logs: tail -f $LOG_FILE"
echo "To stop: ./scripts/stop-auto-commit.sh"
