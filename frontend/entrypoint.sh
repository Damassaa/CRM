#!/bin/sh
# entrypoint.sh - Frontend entrypoint

set -e

echo "🔧 Starting frontend..."

# Ensure node_modules permissions
if [ -d "/app/node_modules" ]; then
    chmod -R 755 /app/node_modules 2>/dev/null || true
fi

# Execute the command passed to the container
exec "$@"
