#!/bin/bash

# Restart Project Dev Server
# Kills existing processes and starts on port 3012

echo "🔄 Restarting dev server..."

# Kill existing Vite processes
echo "🛑 Killing existing Vite processes..."
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true

# Kill processes on specific ports
for port in 3012; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

# Wait a moment for processes to fully terminate
sleep 2

# Navigate to hedera project directory
cd /Users/mac/code/-scdev/hedera/

# Prefer running the connectHashgraph subproject (repo code) if it exists
if [ -f "/Users/mac/code/-scdev/hedera/connectHashgraph/package.json" ]; then
  cd /Users/mac/code/-scdev/hedera/connectHashgraph
  LOG_FILE="/tmp/hedera-dev.log"
  echo "📂 Using subproject: connectHashgraph (logging to $LOG_FILE)"
else
  LOG_FILE="/tmp/hedera-dev.log"
  echo "📂 Using root project (logging to $LOG_FILE)"
fi

# Start the dev server on port 3012 in background with HMR disabled to avoid handshake races
echo "🚀 Starting dev server on port 3012 (HMR disabled)..."
VITE_DISABLE_HMR=true pnpm run dev -- --port 3012 > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Wait a moment and check if server started
sleep 3
echo "✅ Server starting... Check http://localhost:3012"
echo "📋 Server running in background (PID: $SERVER_PID)"
echo "📋 Logs available at: tail -f $LOG_FILE"