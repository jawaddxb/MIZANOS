# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Monorepo with Next.js 16 (React 19) frontend + FastAPI backend + PostgreSQL (async via asyncpg) + Redis.

```
apps/web/          — Next.js frontend (port 3000)
apps/api/          — FastAPI backend (port 8000)
packages/common/   — Shared Python: DB base classes, error handlers, utilities
infra/             — Docker (PostgreSQL 16 on port 5433, Redis 7 on port 6379), Alembic migrations
```

## Key Commands

```bash
make setup          # Full bootstrap: install, docker, migrate, seed
make dev            # Start both API and web concurrently
make dev-api        # Start FastAPI only (port 8000)
make dev-web        # Start Next.js only (port 3000)
make test           # Run all tests
make test-web       # Frontend tests only (Vitest)
make test-api       # Backend tests only (pytest)
make lint           # Lint frontend
make typecheck      # TypeScript strict check
make db-migrate     # Run Alembic migrations (alembic upgrade head)
make db-makemigration  # Generate migration (alembic revision --autogenerate)
make db-seed        # Seed admin user
make docker-up      # Start PostgreSQL (5433) + Redis (6379)
make docker-down    # Stop Docker services
make kill-ports     # Kill processes on ports 3000, 8000
```

## Frontend → Backend Data Flow

The full request pipeline: **Component → Mutation/Query Hook → Repository → apiClient (Axios) → FastAPI Router → Service → SQLAlchemy Model**

### API Client (`apps/web/src/lib/api/client.ts`)
- Axios instance with base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- **Request interceptor**: Adds `Authorization: Bearer {token}` from localStorage
- **Response interceptor**: On 401, queues concurrent failed requests via `failedQueue`, makes a single refresh call to `POST /auth/refresh`, replays all queued requests with the new token. On refresh failure, clears tokens and redirects to `/login`
- **Token storage**: Dual keys in localStorage (`access_token` and `mizan_auth_token`) for backward compatibility from Lovable migration

### Repository Pattern (`apps/web/src/lib/api/repositories/`)
- `BaseRepository<T>` provides generic CRUD: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- Each domain has a concrete repository extending BaseRepository with a `basePath` (e.g., `"/products"` — no `/api` prefix, the client base URL includes it)
- Repositories are exported as **singletons** (e.g., `export const teamRepository = new TeamRepository()`)
- All repositories must be re-exported from `repositories/index.ts`

### React Query Hooks (`apps/web/src/hooks/`)
- **Query hooks** (`hooks/queries/`): Call repository methods, use query keys like `["tasks", productId]`
- **Mutation hooks** (`hooks/mutations/`): Call repository methods, invalidate related query keys on success, show toast via Sonner
- **Feature hooks** (`hooks/features/`): Complex stateful logic (e.g., AI chat streaming)

### Error Handling (`apps/web/src/lib/api/errors.ts`)
- `ApiError` class wraps Axios errors with helpers: `isUnauthorized`, `isForbidden`, `isNotFound`, `isServerError`

## Backend Architecture

### Request Lifecycle
FastAPI Router (thin controller) → Service (business logic) → SQLAlchemy Model (DB)

### Dependency Injection (`apps/api/dependencies.py`)
- `DbSession`: `Annotated[AsyncSession, Depends(get_db)]` — yields async session, auto-commits/rollback
- `CurrentUser`: `Annotated[dict, Depends(get_current_user)]` — extracts JWT, returns `{"id", "email"}`, raises 401 on invalid token

### Services (`apps/api/services/`)
- Receive `AsyncSession` in `__init__`, expose async methods
- Use SQLAlchemy 2.0 patterns: `select(Model).where(...)`, `session.execute()`, `session.flush()`, `session.refresh()`
- Raise errors via `packages.common.utils.error_handlers`: `bad_request(msg)`, `forbidden(msg)`, `not_found(resource)`
- Authorization checks happen in services (replaces Supabase RLS)

### Models (`apps/api/models/`)
- SQLAlchemy 2.0 with `Mapped[Type]` and `mapped_column()` syntax
- Base class from `packages.common.db.base` with mixins: `UUIDMixin` (auto UUID PK), `TimestampMixin` (server-side `created_at`/`updated_at`)
- All models must be imported in `models/__init__.py` and added to `__all__` (required for Alembic autogenerate)

### Schemas (`apps/api/schemas/`)
- Pydantic v2 with `from_attributes=True` for ORM conversion
- Use `model_dump(exclude_unset=True)` for PATCH partial updates

### Auth (`apps/api/services/auth_service.py`)
- JWT HS256 tokens: 30min access, 7day refresh
- bcrypt password hashing via passlib
- Endpoints: `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `GET /auth/me`

### Config (`apps/api/config.py`)
- Pydantic Settings v2 with `.env` file support
- Key vars: `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `CREDENTIAL_ENCRYPTION_KEY`

## Scaffolding Rules (Non-Negotiable)

- **Atomic Design**: atoms → molecules → organisms → templates → pages
- **Repository Pattern** — no raw fetch/API calls in components or hooks
- **TypeScript strict** — no `any`, explicit types
- **CSS variables** — use Tailwind theme classes, never hardcoded colors
- **forwardRef** on atoms wrapping HTML elements
- **Import order**: react/next → third-party → @/ aliases → relative

## SOLID Principles (Non-Negotiable)

All code must adhere to SOLID principles. Violations must be refactored before merging.

- **Single Responsibility (SRP)**: Every file, class, function, and component does exactly one thing. A service handles one domain. A component renders one concern. A hook manages one piece of state or side-effect. If you need the word "and" to describe what it does, split it.
- **Open/Closed (OCP)**: Extend behavior through composition, new subclasses, or configuration — never by modifying existing working code. Use strategy patterns, plugin hooks, or config objects instead of adding `if/else` branches to existing functions.
- **Liskov Substitution (LSP)**: Subclasses and implementations must be drop-in replacements. `BaseRepository` subtypes must honor the base contract. Override methods must accept the same inputs and return compatible outputs.
- **Interface Segregation (ISP)**: Keep interfaces and prop types focused. Components should not accept props they don't use. Services should not expose methods their consumers don't need. Prefer many small, specific types over one large general-purpose type.
- **Dependency Inversion (DIP)**: High-level modules must not depend on low-level details. Components depend on hooks, not API clients. Services receive sessions via DI, not global imports. Use FastAPI `Depends()` on the backend and hook abstractions on the frontend.

## DRY Principle (Non-Negotiable)

Duplicated logic is a bug waiting to happen. Enforce DRY rigorously:

- **Shared utilities** go in `packages/common/` — never copy-paste between `apps/api/` and `apps/web/`
- **Reusable UI** lives in atoms/molecules — if a pattern appears in 2+ components, extract it
- **Base classes first**: Always extend `BaseRepository`, `BaseService`, `BaseSchema` — never recreate CRUD logic
- **Query key factories**: Centralize React Query keys — no string literals scattered across hooks
- **Type reuse**: Define types once in `lib/types/`, re-export from `index.ts` — never redeclare the same shape
- **Constants over magic values**: Extract repeated strings/numbers into named constants
- **Before writing new code**: Search the codebase for existing solutions. If similar logic exists, refactor to share it rather than duplicating

## File Size Limits (Non-Negotiable)

No file may exceed **300 lines of code**. This is a hard ceiling, not a guideline.

- **300 LOC max** per file (components, services, routers, utils — everything)
- **150 LOC max** per hook
- **50 LOC max** per utility function — if longer, it's doing too much (split it)
- When approaching the limit, proactively split before you hit it:
  - Components → extract sub-components or custom hooks
  - Services → split into focused service classes per sub-domain
  - Routers → group related endpoints into sub-routers
  - Utils → break into single-purpose modules
- **Imports/types/interfaces count toward the limit** — keep them lean
- If a file is already over 300 LOC, refactor it before adding more code

## Adding a New Domain (Checklist)

Backend:
1. `apps/api/models/<domain>.py` — SQLAlchemy model extending `Base`, `UUIDMixin`, `TimestampMixin`
2. `apps/api/schemas/<domain>.py` — Pydantic request/response schemas
3. `apps/api/services/<domain>_service.py` — Business logic
4. `apps/api/routers/<domain>.py` — Thin router delegating to service
5. **Register**: Import model in `models/__init__.py` + add to `__all__`; import router in `main.py` + `app.include_router()`

Frontend:
1. `apps/web/src/lib/types/<domain>.ts` — TypeScript types
2. `apps/web/src/lib/api/repositories/<domain>.repository.ts` — Extends BaseRepository with `basePath`
3. `apps/web/src/hooks/queries/use<Domain>.ts` — Query hooks
4. `apps/web/src/hooks/mutations/use<Domain>Mutations.ts` — Mutation hooks
5. **Register**: Re-export types from `types/index.ts`; re-export repository + singleton from `repositories/index.ts`

## Testing

- **Frontend**: Vitest + Testing Library (jsdom), config at `apps/web/vitest.config.ts`, `@/` alias resolves to `./src`
- **Backend**: pytest + pytest-asyncio (`asyncio_mode = "auto"` in pyproject.toml), pytest-cov for coverage

## Porting from Lovable / Supabase SPA

### Prerequisites (Mandatory)

1. Use the `port-lovable` agent: invoke via `/agent port-lovable`
2. Produce `PORT_MANIFEST.md` with every table, function, hook, and component mapped — get user approval before writing any code
3. Run `./scripts/scaffold-domain.sh <domain>` for each domain to generate all 8 boilerplate files

### Supabase → Monorepo Mapping

| Supabase Pattern | Monorepo Equivalent |
|---|---|
| `supabase.from("table").select()` | `repository.getAll()` via `BaseRepository` |
| `supabase.from("table").insert()` | `repository.create(data)` |
| `supabase.from("table").update().eq()` | `repository.update(id, data)` |
| `supabase.from("table").delete().eq()` | `repository.delete(id)` |
| `supabase.functions.invoke("fn")` | FastAPI service method + router endpoint |
| `supabase.auth.getUser()` | `CurrentUser` dependency (`apps/api/dependencies.py`) |
| `supabase.auth.getSession()` | JWT token in `Authorization: Bearer` header |
| Supabase RLS policies | Service-layer authorization checks |
| Supabase realtime | `refetchInterval` on query hooks (or future WebSocket) |

### Common Porting Mistakes

1. **Token key mismatch** — Lovable uses `sb-access-token`; monorepo expects `Authorization: Bearer {jwt}`
2. **Missing router registration** — router file created but `app.include_router()` not added to `main.py`
3. **Stub mutations** — hooks that call `console.log` instead of repository methods. Every mutation must hit a real endpoint
4. **Wrong basePath** — repository `basePath` must match router `prefix` (e.g., `"/products"` not `"/api/products"`)
5. **Missing barrel exports** — types/repos exist but aren't re-exported from `index.ts`
6. **Recreated base classes** — always extend `BaseService`, `BaseRepository`, `BaseSchema`; never create new ones
7. **RLS silently dropped** — Supabase RLS policies must become explicit service-layer auth checks
8. **Hardcoded Supabase IDs** — project URLs, anon keys, or service role keys left in ported code

### Verification Commands

```bash
grep -r "supabase" apps/web/src/ apps/api/ --include="*.ts" --include="*.tsx" --include="*.py" | grep -v node_modules
grep -rn "TODO\|FIXME\|stub\|NotImplementedError" apps/web/src/ apps/api/ --include="*.ts" --include="*.tsx" --include="*.py"
grep -rn "fetch(\|axios\." apps/web/src/components/ apps/web/src/hooks/ --include="*.ts" --include="*.tsx"
make typecheck && make lint
```
