.PHONY: dev build test lint typecheck db-migrate db-makemigration db-seed docker-up docker-down install setup kill-ports

kill-ports:
	@lsof -ti:3006 | xargs kill -9 2>/dev/null || true
	@lsof -ti:4006 | xargs kill -9 2>/dev/null || true

dev: kill-ports
	npm run dev

dev-web: kill-ports
	npm run dev:web

dev-api: kill-ports
	npm run dev:api

build:
	npm run build

test:
	npm run test

test-web:
	npm run test:web

test-api:
	npm run test:api

lint:
	npm run lint

typecheck:
	npm run typecheck

db-migrate:
	npm run db:migrate

db-makemigration:
	npm run db:makemigration

db-seed:
	npm run db:seed

docker-up:
	npm run docker:up

docker-down:
	npm run docker:down

install:
	npm install
	pip3 install -e ".[dev]"

setup: install docker-up
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 5
	$(MAKE) db-migrate
	$(MAKE) db-seed
	@echo "Setup complete! Run 'make dev' to start."
