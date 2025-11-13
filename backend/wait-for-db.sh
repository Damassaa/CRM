#!/bin/sh
# wait-for-db.sh - Wait for PostgreSQL to be ready

set -e

host="$1"
shift
port="$1"
shift

echo "⏳ Waiting for PostgreSQL at $host:$port..."

until nc -z "$host" "$port" > /dev/null 2>&1; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is up - executing command"
exec "$@"
