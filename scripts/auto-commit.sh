#!/bin/bash

# Auto-commit and push script
# Runs continuously, committing and pushing changes every 30 minutes

REPO_DIR="/workspaces/KonomiStandard"
INTERVAL=1800  # 30 minutes in seconds

cd "$REPO_DIR" || exit 1

echo "🚀 Auto-commit service started"
echo "Repository: $REPO_DIR"
echo "Interval: 30 minutes"
echo "Press Ctrl+C to stop"
echo ""

while true; do
    TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    
    # Check if there are any changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "[$TIMESTAMP] Changes detected, committing..."
        
        git add -A
        git commit -m "Auto-commit: $TIMESTAMP" --quiet
        
        if git push origin main --quiet 2>&1; then
            echo "[$TIMESTAMP] ✓ Changes committed and pushed"
        else
            echo "[$TIMESTAMP] ✗ Push failed (will retry next cycle)"
        fi
    else
        echo "[$TIMESTAMP] No changes to commit"
    fi
    
    # Wait 30 minutes
    sleep $INTERVAL
done
