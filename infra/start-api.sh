#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/infra && alembic upgrade head
cd /app

echo "Starting API server..."
exec uvicorn apps.api.main:app --host 0.0.0.0 --port "${PORT:-8000}"
