#!/bin/bash

# Build script with error logging
# Usage: ./rb.sh

LOG_FILE="/tmp/hedera-build.log"

echo "🔨 Building project..."
echo "📝 Logs: $LOG_FILE"

# Run build and capture output
npm run build 2>&1 | tee "$LOG_FILE"

# Check exit status
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed - check $LOG_FILE for details"
    echo ""
    echo "Last 10 lines of build log:"
    tail -10 "$LOG_FILE"
fi