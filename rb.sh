#!/bin/bash

# Build script with error logging
# Usage: ./rb.sh

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/hedera-build.log"

echo "🔨 Building project..."
echo "📝 Logs: $LOG_FILE"
echo "📂 Working directory: $SCRIPT_DIR"

# Change to script directory and run build
cd "$SCRIPT_DIR" && pnpm run build 2>&1 | tee "$LOG_FILE"

# Check exit status
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed - check $LOG_FILE for details"
    echo ""
    echo "Last 10 lines of build log:"
    tail -10 "$LOG_FILE"
fi