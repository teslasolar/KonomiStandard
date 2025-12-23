#!/bin/bash

# Stop the auto-commit service

PID_FILE="/tmp/auto-commit.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "Auto-commit service is not running"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    kill "$PID"
    rm "$PID_FILE"
    echo "✓ Auto-commit service stopped (PID: $PID)"
else
    echo "Process $PID not found (already stopped?)"
    rm "$PID_FILE"
fi
