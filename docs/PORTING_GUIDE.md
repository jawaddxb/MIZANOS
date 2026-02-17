# Lovable → FlowPuppy Porting Guide

A reusable, end-to-end instruction manual for converting any Lovable/Supabase SPA into the FlowPuppy monorepo scaffold (Next.js 16 + FastAPI + PostgreSQL + Redis + Celery).

---

## 1. Architecture Mapping

| Lovable (Source) | FlowPuppy (Target) |
|---|---|
| Supabase PostgreSQL | PostgreSQL 16 via SQLAlchemy 2.0 (port 15432) |
| Supabase Auth (JWT) | FastAPI JWT auth (httpOnly cookies + Bearer) |
| Supabase Edge Functions (Deno) | FastAPI router + service + Celery task |
| Supabase RLS policies | Service-layer authorization checks |
| Supabase Storage | S3 storage service (`packages/common/services/storage/`) |
| Supabase Realtime | Celery tasks + polling (or SSE for chat) |
| `supabase.from("table").select()` | Repository `.get()` → FastAPI → SQLAlchemy `select()` |
| `supabase.from("table").insert()` | Repository `.post()` → FastAPI → SQLAlchemy `session.add()` |
| `supabase.from("table").update().eq()` | Repository `.put()` → FastAPI → SQLAlchemy `session.flush()` |
| `supabase.from("table").delete().eq()` | Repository `.delete()` → FastAPI → SQLAlchemy `session.delete()` |
| `supabase.functions.invoke("fn")` | Repository `.post("/api/v1/...")` → FastAPI service |
| `supabase.rpc("fn")` | FastAPI endpoint or inline service logic |
| `supabase.auth.getUser()` | `get_current_user` dependency (`packages/common/core/auth_deps.py`) |
| `supabase.auth.signInWithPassword()` | `POST /api/v1/auth/login` |
| `supabase.auth.signUp()` | `POST /api/v1/auth/register` |
| React Router DOM | Next.js App Router (file-based) |
| Vite | Next.js 16 (Turbopack dev, Webpack prod) |
| shadcn-ui components | `@baseflow/ui` components |
| `useQuery()` with Supabase calls | `useQuery()` with Repository calls |
| Sonner toasts | Sonner toasts (same library) |
| dnd-kit | dnd-kit (same library) |
| React Hook Form + Zod | React Hook Form + Zod (same) |

---

## 2. Project Structure Mapping

```
Lovable                          →  FlowPuppy
─────────────────────────────────────────────────────
src/pages/                       →  apps/{brand}/app/(authenticated)/
src/components/ui/               →  packages/ui/src/components/atoms/
src/components/{domain}/         →  apps/{brand}/components/organisms/{domain}/
src/hooks/use{Domain}.ts         →  packages/shared/src/hooks/queries/use{Domain}.ts
src/types/                       →  packages/shared/src/types/
src/integrations/supabase/       →  (removed — no Supabase)
supabase/functions/{fn}/         →  packages/common/services/{domain}/
supabase/migrations/             →  infra/alembic/versions/
(Supabase RLS in SQL)            →  Authorization logic in services
```

---

## 3. Code Quality Standards (Non-Negotiable)

These principles apply to **every file** ported or created. Violations must be fixed before merging.

### 3.1 SOLID Principles

**Single Responsibility (SRP)** — Every file, class, function, and component does exactly one thing.
- A service handles one domain. A component renders one concern. A hook manages one piece of state or side-effect.
- If you need the word "and" to describe what it does, split it.
- Lovable components often mix data fetching, business logic, and rendering — separate these during porting.

**Open/Closed (OCP)** — Extend behavior through composition, not modification.
- Use strategy patterns, config objects, or new subclasses instead of adding `if/else` branches to existing functions.
- When porting a Lovable component that handles multiple modes via conditionals, extract each mode into its own component.

**Liskov Substitution (LSP)** — Subclasses must be drop-in replacements.
- `BaseRepository` subtypes must honor the base contract. Override methods must accept the same inputs and return compatible outputs.
- When extending `BaseService`, don't change the expected behavior of inherited methods.

**Interface Segregation (ISP)** — Keep interfaces and prop types focused.
- Components should not accept props they don't use. Services should not expose methods their consumers don't need.
- Lovable components frequently pass 15+ props — break these into smaller, focused interfaces during porting.

**Dependency Inversion (DIP)** — High-level modules must not depend on low-level details.
- Components depend on hooks, not API clients. Services receive sessions via DI, not global imports.
- Backend: Use FastAPI `Depends()` for injection. Frontend: Use hook abstractions, never call repositories directly from components.
- This is the single most important change from Lovable patterns, where components often call `supabase.from(...)` directly.

### 3.2 DRY (Don't Repeat Yourself)

Duplicated logic is a bug waiting to happen. Enforce DRY rigorously:

- **Shared utilities** go in `packages/common/` — never copy-paste between apps
- **Reusable UI** lives in atoms/molecules — if a pattern appears in 2+ components, extract it
- **Base classes first**: Always extend `BaseRepository`, `BaseService` — never recreate CRUD logic
- **Query key factories**: Centralize React Query keys — no string literals scattered across hooks
- **Type reuse**: Define types once in `types/`, re-export from `index.ts` — never redeclare the same shape
- **Constants over magic values**: Extract repeated strings/numbers into named constants
- **Before writing new code**: Search the codebase for existing solutions. If similar logic exists, refactor to share it rather than duplicating

**Common Lovable DRY violations to watch for:**
- Same Supabase query pattern duplicated across multiple hooks → consolidate into one repository method
- Identical toast/error handling in every mutation → extract into a shared mutation wrapper
- Repeated authorization checks → extract into a service mixin or middleware

### 3.3 KISS (Keep It Simple, Stupid)

Write the simplest code that solves the problem. Complexity is a cost, not a feature.

- **No premature abstractions** — don't create helpers, utilities, or factories for one-time operations. Three similar lines of code is better than a premature abstraction.
- **No speculative generality** — don't design for hypothetical future requirements. Build for today, refactor when the need is real.
- **No over-engineering** — a bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need extra configurability.
- **No unnecessary error handling** — only validate at system boundaries (user input, external APIs). Trust internal code and framework guarantees.
- **No feature flags or backwards-compatibility shims** — if you're porting, just write the target code. No need to support both old and new patterns simultaneously.
- **Flat over nested** — prefer early returns over deeply nested `if/else` chains. Prefer simple loops over complex functional chains when readability suffers.
- **Obvious over clever** — if a colleague can't understand the code in 10 seconds, simplify it.

**During porting specifically:**
- Don't add comments explaining what Supabase used to do — just write clean target code
- Don't add TypeScript overloads or generics unless the type system demands it
- Don't add error recovery for scenarios that can't happen in the new architecture
- If a Lovable component has features nobody uses, drop them — port what matters

### 3.4 File Size Limits

No file may exceed **300 lines of code**. This is a hard ceiling, not a guideline.

| Scope | Max LOC |
|---|---|
| Any file (component, service, router, util) | **300** |
| Hook file | **150** |
| Utility function | **50** |

When approaching the limit, proactively split before you hit it:
- **Components** → extract sub-components or custom hooks
- **Services** → split into focused service classes per sub-domain
- **Routers** → group related endpoints into sub-routers
- **Utils** → break into single-purpose modules

**Imports, types, and interfaces count toward the limit** — keep them lean.

If a Lovable source file is 500+ lines (common), you **must** decompose it during porting. Never port a large file as-is. Plan the split before writing any code:
1. Identify distinct responsibilities in the source file
2. Map each responsibility to a target file
3. Port each piece separately

---

## 4. Step-by-Step Domain Porting Checklist

For **each domain** (products, tasks, specs, etc.), follow this sequence:

### Backend (Python)

#### 4.1 Model

- **File**: `packages/common/models/{domain}.py`
- Map Supabase table columns → SQLAlchemy `Mapped[Type]` + `mapped_column()`
- Extend `Base`, `UUIDMixin`, `TimestampMixin`
- Use `UUID(as_uuid=True)` for UUID PKs/FKs
- Use `JSON` for JSONB columns, `Text` for long strings
- Array columns (e.g., `skills text[]`) → use `ARRAY(String)` from `sqlalchemy.dialects.postgresql`
- Encrypted columns → use `String` and encrypt/decrypt in service layer via Fernet (`packages/common/core/config.py` has encryption key)
- **Register**: Import in `packages/common/models/__init__.py`, add to `__all__`

**Column type mapping:**

| Supabase type | SQLAlchemy type |
|---|---|
| `uuid` | `UUID(as_uuid=True)` |
| `text` | `String` or `Text` |
| `integer` / `int4` | `Integer` |
| `bigint` / `int8` | `BigInteger` |
| `boolean` | `Boolean` |
| `timestamp with tz` | `DateTime(timezone=True)` |
| `jsonb` | `JSON` (from `sqlalchemy.dialects.postgresql`) |
| `text[]` | `ARRAY(String)` |
| `numeric` | `Numeric` |
| `date` | `Date` |

#### 4.2 Schema

- **File**: `packages/common/schemas/{domain}.py`
- Create Pydantic V2 schemas: `{Domain}Create`, `{Domain}Update`, `{Domain}Response`
- Use `ConfigDict(from_attributes=True)` on response schemas
- Use `model_dump(exclude_unset=True)` for PATCH updates
- Match field names to the model exactly

#### 4.3 Service

- **File**: `packages/common/services/{domain}/{domain}_service.py`
- Receives `AsyncSession` in `__init__`
- Port Supabase queries → SQLAlchemy 2.0 async:

```python
# Supabase: supabase.from("products").select("*").eq("id", id).single()
# SQLAlchemy:
result = await self.db.execute(select(Product).where(Product.id == id))
product = result.scalar_one_or_none()
```

- Port RLS policies → explicit authorization checks:

```python
# Supabase RLS: "user must be product member"
# Service:
if not await self._is_member(user_id, product_id):
    raise forbidden("Not a member of this product")
```

- For Supabase RPC functions → inline the logic or create a utility method
- For edge functions with LLM calls → create Celery tasks for long-running ops
- **Register**: Export from `packages/common/services/__init__.py`

#### 4.4 Router

- **File**: Create in appropriate API app (`apps/workflow_api/api/v1/{domain}.py` or `apps/platform_api/api/v1/{domain}.py`)
- Thin controller — delegate all logic to service
- Use dependency injection: `current_user: User = Depends(get_current_active_user)`
- Use `DbSession` type annotation for database session
- **Register**: Add `app.include_router()` in the appropriate `main.py`

#### 4.5 Migration

- Run: `make migrate-create` with descriptive message
- Verify autogenerated migration, remove unrelated changes
- Run: `make migrate-up`

### Frontend (TypeScript)

#### 4.6 Types

- **File**: `packages/shared/src/types/{domain}.ts`
- Port from Lovable `src/types/` or extract from Supabase generated types
- Use strict TypeScript — no `any`
- **Register**: Re-export from `packages/shared/src/types/index.ts`

#### 4.7 Repository

- **File**: `packages/shared/src/api/repositories/{domain}.repository.ts`
- Extend `BaseRepository`
- Map each Supabase call to a repository method:

```typescript
// Lovable: supabase.from("products").select("*").eq("pillar", pillar)
// Repository:
async listByPillar(pillar: string): Promise<Product[]> {
  return this.get("/api/v1/products", { params: { pillar } });
}
```

- Export singleton instance
- **Register**: Re-export from `packages/shared/src/api/repositories/index.ts`

#### 4.8 Hooks

- **File**: `packages/shared/src/hooks/queries/use{Domain}.ts`
- Port React Query hooks — replace Supabase calls with repository calls:

```typescript
// Lovable:
const { data } = useQuery({
  queryKey: ["products"],
  queryFn: () => supabase.from("products").select("*"),
});

// FlowPuppy:
const { data } = useQuery({
  queryKey: ["products"],
  queryFn: () => productsRepository.list(),
});
```

- Keep same query keys for cache consistency
- Keep same `onSuccess` / `onError` patterns (toast, invalidation)

#### 4.9 Components

- **File**: `apps/{brand}/components/organisms/{domain}/`
- Port component JSX — replace:
  - `shadcn-ui` imports → `@baseflow/ui` imports
  - Direct Supabase calls in components → hook calls only (DIP)
  - Lovable routing (`useNavigate()`, `<Link>`) → Next.js (`useRouter()`, `<Link>`)
  - `useAuth()` from Supabase context → auth hooks from `@baseflow/shared`
- Follow atomic design: atoms → molecules → organisms

#### 4.10 Pages

- **File**: `apps/{brand}/app/(authenticated)/{domain}/page.tsx`
- Next.js App Router — each page is a `page.tsx` in its route folder
- Use `"use client"` directive for interactive pages
- Import organisms, compose the page

---

## 5. Auth Porting

### Token Storage

| Lovable | FlowPuppy |
|---|---|
| `localStorage` (`access_token`) | httpOnly cookies (set by backend) |
| Supabase client auto-manages tokens | `BaseRepository` auto-retries on 401 with `/auth/refresh` |

### Auth Actions

| Lovable | FlowPuppy |
|---|---|
| `supabase.auth.signInWithPassword()` | `POST /api/v1/auth/login` (sets cookies) |
| `supabase.auth.signUp()` | `POST /api/v1/auth/register` + email verification |
| `supabase.auth.signOut()` | `POST /api/v1/auth/logout` (clears cookies) |
| `supabase.auth.getSession()` | Cookie sent automatically; `GET /api/v1/auth/me` |
| `supabase.auth.onAuthStateChange()` | Check auth state on page load / route change |
| `supabase.auth.resetPasswordForEmail()` | `POST /api/v1/auth/forgot-password` |
| `ProtectedRoute` component | `(authenticated)/layout.tsx` with auth check |

### User Model Differences

| Lovable (`profiles` table) | FlowPuppy (`users` table) |
|---|---|
| `id` (from Supabase Auth) | `id` (UUID, auto-generated) |
| `email` (from auth.users) | `email` (on User model directly) |
| `full_name` | `display_name` |
| `role` (enum in profiles) | Roles via separate mechanism or user fields |
| `status` (active/suspended) | `is_active` boolean |
| `avatar_url` | Add if needed |
| `skills`, `availability_hours` | Add if needed (domain-specific fields) |

### Protected Routes

```
Lovable:
  <ProtectedRoute><Component /></ProtectedRoute>

FlowPuppy:
  app/(authenticated)/layout.tsx checks auth
  All pages under (authenticated)/ are auto-protected
```

---

## 6. Edge Function → Service/Celery Task Decision

Each Lovable edge function maps to either a **synchronous FastAPI endpoint** (fast operations) or a **Celery async task** (long-running LLM/scraping operations).

**Rule of thumb**: If the operation takes > 10 seconds, use a Celery task.

### Typical Edge Function Categories

| Category | Examples | Target |
|---|---|---|
| LLM generation | Spec generation, QA checklist, doc summary | Celery async task |
| Web scraping | Firecrawl single/multi-page | Sync (single) / Celery (multi) |
| Repository analysis | GitHub repo analysis, audit | Celery async task |
| Audio transcription | Voice notes, audio files | Celery async task |
| Simple CRUD | Fetch GitHub info, shared docs | Sync FastAPI endpoint |
| Auth flows | OAuth callback, invite user | Sync FastAPI endpoint |
| Scheduled jobs | Daily scanner, notification digest | Celery beat periodic task |
| Seeding | Deployment/marketing checklist | Service method called on create |

### Celery Task Pattern

```python
# packages/common/tasks/{domain}_tasks.py
from packages.common.tasks.celery_app import celery_app

@celery_app.task(bind=True, max_retries=2, soft_time_limit=300)
def generate_specification_task(self, product_id: str, user_id: str):
    """Long-running LLM spec generation."""
    # 1. Create DB session
    # 2. Call service method
    # 3. Update job/task status
    # 4. Handle errors + retry
```

---

## 7. RLS → Service Authorization

Every Supabase RLS policy must become an explicit check in the service layer. **Do not silently drop RLS policies** — each one represents a security boundary.

### Common Patterns

**"User can only see own data":**

```python
# RLS: auth.uid() = user_id
# Service:
async def get_by_user(self, user_id: UUID) -> list[Model]:
    stmt = select(Model).where(Model.user_id == user_id)
    ...
```

**"Product members can view":**

```python
# RLS: is_product_member(auth.uid(), product_id)
# Service:
async def _assert_member(self, user_id: UUID, product_id: UUID) -> None:
    stmt = select(ProductMember).where(
        ProductMember.user_id == user_id,
        ProductMember.product_id == product_id,
    )
    result = await self.db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise forbidden("Not a member of this product")
```

**"Only admins can manage":**

```python
# RLS: has_role(auth.uid(), 'admin')
# Service:
if not current_user.has_role("admin"):
    raise forbidden("Admin access required")
```

**"Creator can edit":**

```python
# RLS: auth.uid() = created_by
# Service (use OwnedEntityMixin):
class MyService(OwnedEntityMixin):
    async def update(self, id: UUID, data: dict, user: User):
        entity = await self.get_or_404(id)
        self.assert_owner(entity, user)  # raises 403 if not owner
        ...
```

---

## 8. Database Table Porting Priority

### Tables That Likely Exist in FlowPuppy Already

- `users` (maps from Lovable `profiles`) — extend with app-specific fields
- `chat_conversations` / `chat_messages` — already implemented
- `provider_credentials` — maps to credential vault
- `api_keys` — already implemented

### Recommended Priority Order

**P0 — Core (port first, everything depends on these):**
1. Products — central entity
2. Product members — authorization depends on membership
3. Tasks — most-used feature
4. User roles — role-based access

**P1 — Product Features:**
5. Specifications + features + sources
6. QA checks
7. Documents + folders + versions + access links
8. Product environments
9. Deployment checklist items
10. External document links

**P2 — Team & Management:**
11. Project stakeholders
12. Management notes + access control
13. Partner notes
14. Team/national holidays
15. Project completions

**P3 — Marketing & Integrations:**
16. Marketing checklist items + templates
17. Marketing domains + social handles + credentials
18. Global integrations + project integrations

**P4 — Audit & Analysis:**
19. Audits + repository analyses + scan history
20. Notifications + notification preferences
21. Knowledge entries

**P5 — Templates & Settings:**
22. Task templates + template groups
23. Modules + feature permissions + role permissions
24. Standards repositories
25. Permission audit log + user permission overrides
26. User GitHub connections

---

## 9. Frontend Component Mapping

### UI Component Substitutions

| Lovable (shadcn-ui) | FlowPuppy (@baseflow/ui) |
|---|---|
| `@/components/ui/button` | `@baseflow/ui` Button |
| `@/components/ui/card` | `@baseflow/ui` Card |
| `@/components/ui/input` | `@baseflow/ui` Input |
| `@/components/ui/dialog` | `@baseflow/ui` Dialog |
| `@/components/ui/tabs` | `@baseflow/ui` Tabs |
| `@/components/ui/badge` | `@baseflow/ui` Badge |
| `@/components/ui/select` | `@baseflow/ui` Select |
| `@/components/ui/tooltip` | `@baseflow/ui` Tooltip |
| `@/components/ui/skeleton` | Create or use loading states |

### Routing Changes

```typescript
// Lovable (React Router)
import { useNavigate, useParams, Link } from "react-router-dom";
const navigate = useNavigate();
navigate("/products/" + id);

// FlowPuppy (Next.js App Router)
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
const router = useRouter();
router.push("/products/" + id);
```

### Auth Context Changes

```typescript
// Lovable
import { useAuth } from "@/components/auth/AuthProvider";
const { user, session, signOut } = useAuth();

// FlowPuppy — auth handled via cookies + protected layout
import { useCurrentUser } from "@baseflow/shared/hooks";
const { user, logout } = useCurrentUser();
```

---

## 10. Common Porting Mistakes

1. **Supabase references left in code** — grep for `supabase`, `sb-`, `SUPABASE` after porting each file
2. **Missing authorization** — every RLS policy must become a service check; don't silently drop them
3. **Wrong base URL** — repositories hit `/api/v1/...`, not direct table names
4. **Hardcoded Supabase IDs** — project URLs, anon keys, service role keys left in ported code
5. **Token mismatch** — Lovable uses `sb-access-token`; FlowPuppy uses httpOnly cookies
6. **Missing model registration** — model file created but not imported in `__init__.py`
7. **Missing router registration** — router created but `app.include_router()` not called in `main.py`
8. **Stub mutations** — hooks that `console.log` instead of calling real endpoints
9. **Recreating base classes** — always extend existing `BaseRepository`, service patterns; never build from scratch
10. **Missing barrel exports** — types/repos created but not re-exported from `index.ts`
11. **Edge function timeout patterns** — Lovable edge functions have 60s timeout; use Celery for anything > 10s
12. **Supabase `.single()` vs `.maybeSingle()`** — map to `scalar_one()` vs `scalar_one_or_none()`
13. **Files exceeding 300 LOC** — Lovable components are often 500+ lines. Decompose during porting, never port as-is
14. **God components** — Lovable mixes data fetching + logic + rendering in one file. Split per SRP during porting
15. **Duplicated logic across hooks** — consolidate shared patterns into base utilities or shared hooks

---

## 11. Verification Checklist (Per Domain)

After porting each domain, run these checks:

```bash
# 1. No Supabase references remaining
grep -r "supabase" packages/common/services/{domain}/ apps/*/components/*{domain}* \
  --include="*.ts" --include="*.tsx" --include="*.py"

# 2. No stubs or TODOs
grep -rn "TODO\|FIXME\|stub\|NotImplementedError\|console.log" \
  packages/common/services/{domain}/ --include="*.py"

# 3. No raw fetch/axios in frontend (must use repository)
grep -rn "fetch(\|axios\." apps/*/components/ apps/*/hooks/ \
  --include="*.ts" --include="*.tsx"

# 4. TypeScript compiles
npm run typecheck --workspace=apps/{brand}

# 5. Python imports work
python -c "from packages.common.models.{domain} import {Model}; print('OK')"
python -c "from packages.common.services.{domain} import {Service}; print('OK')"

# 6. Migration applied
make migrate-up

# 7. API responds
curl http://localhost:18000/api/v1/{domain} -H "Cookie: ..."

# 8. No file exceeds 300 LOC
find packages/common/services/{domain}/ apps/*/components/*{domain}* \
  -name "*.py" -o -name "*.ts" -o -name "*.tsx" | \
  xargs wc -l | awk '$1 > 300 {print "VIOLATION:", $0}'

# 9. No duplicated logic (spot check)
# Manually review: are there repeated patterns that should be extracted?
```

---

## 12. Recommended Porting Order

Port domains in this order — each builds on the previous:

1. **Users/Auth** — extend existing User model with Lovable profile fields
2. **Products** — central entity, gates everything else
3. **Product Members** — needed for authorization in all subsequent domains
4. **Tasks** — most-used feature, validates full stack works end-to-end
5. **Specifications** — tests LLM integration via Celery
6. **Documents** — tests file storage integration
7. **QA Checks** — simple CRUD + LLM generation
8. **Environments** — simple CRUD
9. **Deployment Checklist** — simple CRUD + seeding
10. **Stakeholders** — simple CRUD
11. **Marketing** — multiple sub-tables
12. **Audit/Analysis** — complex, GitHub integration
13. **Notifications** — cross-cutting concern
14. **Knowledge Base** — CRUD + file handling
15. **Templates** — admin feature, lower priority
16. **Settings/Permissions** — admin feature

---

## 13. Full-Stack Porting Template (Copy-Paste Per Domain)

Use this as a checklist when porting each domain:

```
Domain: _______________

Backend:
  [ ] Model created: packages/common/models/{domain}.py
  [ ] Model registered in packages/common/models/__init__.py
  [ ] Schema created: packages/common/schemas/{domain}.py
  [ ] Service created: packages/common/services/{domain}/{domain}_service.py
  [ ] Service registered in packages/common/services/__init__.py
  [ ] Router created: apps/{api}/api/v1/{domain}.py
  [ ] Router registered in apps/{api}/main.py
  [ ] Migration generated and applied
  [ ] RLS policies mapped to service authorization checks
  [ ] Edge functions mapped to endpoints or Celery tasks

Frontend:
  [ ] Types created: packages/shared/src/types/{domain}.ts
  [ ] Types re-exported from packages/shared/src/types/index.ts
  [ ] Repository created: packages/shared/src/api/repositories/{domain}.repository.ts
  [ ] Repository re-exported from packages/shared/src/api/repositories/index.ts
  [ ] Query hooks created: packages/shared/src/hooks/queries/use{Domain}.ts
  [ ] Mutation hooks created: packages/shared/src/hooks/mutations/use{Domain}Mutations.ts
  [ ] Components ported: apps/{brand}/components/organisms/{domain}/
  [ ] Page created: apps/{brand}/app/(authenticated)/{domain}/page.tsx

Verification:
  [ ] No supabase references (grep check)
  [ ] No stubs or TODOs
  [ ] TypeScript compiles
  [ ] Python imports work
  [ ] API responds correctly
  [ ] Authorization works (test as member vs non-member)

Code Quality:
  [ ] No file exceeds 300 LOC (150 for hooks, 50 for utils)
  [ ] Each file has a single responsibility (SRP)
  [ ] Components use hooks, not direct API calls (DIP)
  [ ] No duplicated logic across files (DRY)
  [ ] No premature abstractions or over-engineering (KISS)
  [ ] Base classes extended, not recreated (OCP)
  [ ] Large Lovable source files decomposed into focused target files
```
