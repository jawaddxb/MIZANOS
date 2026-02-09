# Mizan Flow - Developer Guide

## Architecture

Monorepo with Next.js 16 (React 19) frontend + FastAPI backend + PostgreSQL.

## Scaffolding Rules (Non-Negotiable)

- **300 LOC max** per file — split when exceeding
- **150 LOC max** per hook — split when exceeding
- **Atomic Design**: atoms → molecules → organisms → templates → pages
- **Repository Pattern** — no raw fetch/API calls in components or hooks
- **TypeScript strict** — no `any`, explicit types
- **CSS variables** — use Tailwind theme classes, never hardcoded colors
- **forwardRef** on atoms wrapping HTML elements
- **SOLID**: Single responsibility per file
- **DRY**: Shared code in `packages/common/`, reusable atoms/molecules, base repository/service classes
- **Import order**: react/next → third-party → @/ aliases → relative

## Project Structure

```
apps/web/     — Next.js frontend (port 3000)
apps/api/     — FastAPI backend (port 8000)
packages/common/ — Shared Python utilities
infra/        — Docker, Alembic migrations
```

## Key Commands

```bash
make setup        # Full bootstrap: install, docker, migrate, seed
make dev          # Start both API and web (concurrently)
make dev-api      # Start FastAPI only (port 8000)
make dev-web      # Start Next.js only (port 3000)
make test         # Run all tests
make lint         # Lint frontend
make typecheck    # TypeScript strict check
make db-migrate   # Run Alembic migrations
make db-seed      # Seed admin user
make docker-up    # Start PostgreSQL (5433) + Redis (6379)
make docker-down  # Stop Docker services
```

## Frontend Conventions

- Components: `src/components/{atoms,molecules,organisms,templates}/`
- Hooks: `src/hooks/{queries,mutations,features,utils}/`
- API: `src/lib/api/repositories/` — one per domain, extending `base.repository.ts`
- Types: `src/lib/types/` — one per domain
- Pages: `src/app/(app)/` for protected, `src/app/(auth)/` for public

## Backend Conventions

- Routers: Thin controllers, delegate to services
- Services: Business logic, extend `BaseService` for generic CRUD
- Models: SQLAlchemy 2.0, use `Base`, `TimestampMixin`, `UUIDMixin`
- Schemas: Pydantic v2, `from_attributes=True`
- Dependencies: `DbSession`, `CurrentUser` via FastAPI `Depends()`

## Testing

- Frontend: Vitest + Testing Library
- Backend: pytest + pytest-asyncio

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

### File Registration Checklist (Per Domain)

Every domain requires updates to these 4 barrel files:

1. **`apps/api/models/__init__.py`** — import model + add to `__all__`
2. **`apps/api/main.py`** — import router + `app.include_router()`
3. **`apps/web/src/lib/types/index.ts`** — re-export domain types
4. **`apps/web/src/lib/api/repositories/index.ts`** — re-export repository class + singleton

### Verification Commands

```bash
# No leftover Supabase references
grep -r "supabase" apps/web/src/ apps/api/ --include="*.ts" --include="*.tsx" --include="*.py" | grep -v node_modules

# No stubs
grep -rn "TODO\|FIXME\|stub\|NotImplementedError" apps/web/src/ apps/api/ --include="*.ts" --include="*.tsx" --include="*.py"

# No direct API calls in components/hooks
grep -rn "fetch(\|axios\." apps/web/src/components/ apps/web/src/hooks/ --include="*.ts" --include="*.tsx"

# Build checks
make typecheck && make lint
```

### Common Porting Mistakes

1. **Token key mismatch** — Lovable uses `sb-access-token`; monorepo expects `Authorization: Bearer {jwt}`. Ensure `apiClient` sends the correct header.
2. **Missing router registration** — router file created but `app.include_router()` not added to `main.py`. Every router MUST be registered.
3. **Stub mutations** — hooks that call `console.log` instead of repository methods. Every mutation must hit a real endpoint.
4. **Wrong basePath** — repository `basePath` must match router `prefix` (e.g., `"/products"` not `"/api/products"` — the client base URL includes `/api`).
5. **Missing barrel exports** — types/repos exist but aren't re-exported from `index.ts`. Other files can't import them.
6. **Recreated base classes** — always extend `BaseService`, `BaseRepository`, `BaseSchema`; never create new ones.
7. **RLS silently dropped** — Supabase RLS policies must become explicit service-layer auth checks.
8. **Hardcoded Supabase IDs** — project URLs, anon keys, or service role keys left in ported code.
