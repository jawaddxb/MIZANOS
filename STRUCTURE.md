# Mizan Flow - Project Structure

## Monorepo Layout

```
mizan-flow/
├── apps/
│   ├── web/                          # Next.js 16 + React 19
│   │   ├── src/
│   │   │   ├── app/                  # App Router
│   │   │   │   ├── (auth)/           # Public auth routes
│   │   │   │   ├── (app)/            # Protected routes
│   │   │   │   └── documents/shared/ # Public shared docs
│   │   │   ├── components/
│   │   │   │   ├── atoms/            # Single element wrappers
│   │   │   │   ├── molecules/        # Composed atoms
│   │   │   │   ├── organisms/        # Complex sections
│   │   │   │   ├── templates/        # Layouts
│   │   │   │   └── providers/        # React providers
│   │   │   ├── contexts/             # Auth, Theme contexts
│   │   │   ├── hooks/
│   │   │   │   ├── queries/          # Read hooks
│   │   │   │   ├── mutations/        # Write hooks
│   │   │   │   ├── features/         # Complex hooks
│   │   │   │   └── utils/            # Utility hooks
│   │   │   ├── lib/
│   │   │   │   ├── api/              # API client + repositories
│   │   │   │   ├── types/            # TypeScript types
│   │   │   │   ├── utils/            # cn, logger
│   │   │   │   └── constants/        # Pillars, statuses, roles
│   │   │   ├── styles/globals.css    # CSS variables + Tailwind
│   │   │   └── middleware.ts         # JWT route protection
│   │   └── __tests__/
│   │
│   └── api/                          # FastAPI (Python)
│       ├── main.py                   # App entry
│       ├── config.py                 # Pydantic Settings
│       ├── dependencies.py           # DI: get_db, get_current_user
│       ├── routers/                  # 16 router files
│       ├── services/                 # 16 service files + base
│       ├── models/                   # 16 model files + enums
│       ├── schemas/                  # 16 schema files + base
│       └── middleware/               # Logging, security headers
│
├── packages/common/                  # Shared Python code
│   ├── db/                           # Session, base models, repository
│   ├── core/                         # Config, logging
│   └── utils/                        # Error handlers
│
├── infra/
│   ├── alembic/                      # Database migrations
│   ├── docker-compose.yml            # PostgreSQL + Redis
│   └── Dockerfile.{api,web}
│
├── tests/{unit,integration,e2e}/
├── package.json                      # Workspace root
├── pyproject.toml                    # Python dependencies
├── Makefile                          # Dev commands
└── CLAUDE.md                         # Developer guide
```

## Database Tables (47)

Organized into 16 model files:
- user (5 tables), product (6), task (2), specification (3)
- qa (1), audit (3), document (4), notification (1)
- knowledge (1), vault (1), marketing (5), settings (10)
- ai (2), deployment (1), project (2), enums

## API Endpoints (16 routers)

auth, products, tasks, qa, documents, notifications, ai, github,
audit, marketing, knowledge, vault, team, settings, specifications, scrape
