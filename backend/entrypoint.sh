#!/bin/sh
# entrypoint.sh - Backend entrypoint that fixes line endings at runtime

set -e

echo "🔧 Fixing line endings..."
# Convert CRLF to LF for all shell scripts
if command -v dos2unix > /dev/null 2>&1; then
    dos2unix /app/start.sh 2>/dev/null || sed -i 's/\r$//' /app/start.sh
    dos2unix /app/wait-for-db.sh 2>/dev/null || sed -i 's/\r$//' /app/wait-for-db.sh
else
    sed -i 's/\r$//' /app/start.sh 2>/dev/null || true
    sed -i 's/\r$//' /app/wait-for-db.sh 2>/dev/null || true
fi

chmod +x /app/start.sh /app/wait-for-db.sh

echo "✅ Line endings fixed"

# Execute the command passed to the container
exec "$@"
