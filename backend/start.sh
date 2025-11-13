#!/bin/sh
# start.sh - Robust startup script for backend

set -e

echo "🚀 Starting CRM Backend..."

# Wait for PostgreSQL (backup wait)
echo "⏳ Waiting for database..."
sleep 5

# Generate Prisma Client (in case it wasn't generated)
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations with retries
echo "🔄 Running database migrations..."
MAX_RETRIES=5
RETRY_COUNT=0

until npx prisma migrate deploy 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "   Migration attempt $RETRY_COUNT failed, retrying in 3s..."
  sleep 3
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "⚠️  Migration failed after $MAX_RETRIES attempts, trying db push..."
  npx prisma db push --skip-generate --accept-data-loss || echo "⚠️  DB push also failed, continuing anyway..."
fi

# Run seed
echo "🌱 Running seed..."
npx tsx prisma/seed.ts || echo "⚠️  Seed failed or already exists, continuing..."

# Start server
echo "✅ Starting server..."
npm run dev
