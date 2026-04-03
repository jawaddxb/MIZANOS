#!/bin/sh
set -e

# Wait for database to accept connections before running migrations
MAX_RETRIES=15
RETRY_COUNT=0
echo "Waiting for database..."
until python -c "
import asyncio, asyncpg, os
async def check():
    url = os.environ.get('DATABASE_URL', '').replace('+asyncpg', '')
    conn = await asyncpg.connect(url)
    await conn.close()
asyncio.run(check())
" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Database not reachable after ${MAX_RETRIES} attempts"
    exit 1
  fi
  echo "Database not ready (attempt ${RETRY_COUNT}/${MAX_RETRIES}), retrying in 2s..."
  sleep 2
done
echo "Database is ready."

echo "Running database migrations..."
cd /app/infra && alembic upgrade head
cd /app

echo "Starting API server..."
exec uvicorn apps.api.main:app --host 0.0.0.0 --port "${PORT:-8000}"
