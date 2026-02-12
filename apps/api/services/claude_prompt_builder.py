"""Builds Claude Code prompts for generated porting tasks."""

from apps.api.schemas.lovable_manifest import (
    ExtractedAuth, ExtractedComponent, ExtractedEdgeFunction, ExtractedEnvVar,
    ExtractedHook, ExtractedQuery, ExtractedRLSPolicy, ExtractedRPC,
    ExtractedRealtimeSubscription, ExtractedRoute, ExtractedStorageBucket,
    ExtractedTable,
)

# TypeScript → SQLAlchemy type mapping: (python_type, sa_column_type)
_TS_TO_SA: dict[str, tuple[str, str]] = {
    "string": ("str", "String"),
    "number": ("int", "Integer"),
    "boolean": ("bool", "Boolean"),
    "Date": ("datetime", "DateTime(timezone=True)"),
    "Json": ("dict", "JSON"),
}

# Column name patterns that indicate float rather than int
_FLOAT_PATTERNS = {"price", "amount", "rate", "cost", "total", "salary",
                   "weight", "height", "latitude", "longitude", "score",
                   "percentage", "ratio", "balance", "fee", "tax", "discount"}

# Common porting mistakes per phase (from CLAUDE.md + port-lovable.md)
_PHASE_MISTAKES: dict[str, list[str]] = {
    "backend_model": [
        "Token key mismatch: Lovable uses `sb-access-token`; monorepo expects `Authorization: Bearer {jwt}`.",
        "Never recreate base classes: always extend `Base`, `UUIDMixin`, `TimestampMixin` from `packages.common.db.base`.",
        "Hardcoded Supabase IDs: remove any project URLs, anon keys, or service role keys from ported code.",
        "Always add `from_attributes = True` (via BaseSchema) on Pydantic response schemas.",
    ],
    "backend_service": [
        "RLS policies must become explicit service-layer auth checks — they are silently dropped otherwise.",
        "Split combined RLS policies into separate per-role checks (anon vs authenticated) — Lovable projects often combine them.",
        "Missing router registration: every router MUST be added via `app.include_router()` in `main.py`.",
        "Stub mutations: hooks that `console.log` instead of calling repository methods. Every mutation must hit a real endpoint.",
        "Always extend `BaseService` — never create a new base class.",
    ],
    "frontend_types": [
        "Wrong basePath: repository `basePath` must match router `prefix` (e.g., `\"/products\"` not `\"/api/products\"`).",
        "Missing barrel exports: types/repos must be re-exported from `index.ts` or other files can't import them.",
        "Always extend `BaseRepository` — never create a new base class.",
    ],
    "frontend_hooks": [
        "Stub mutations: hooks that `console.log` instead of calling repository methods are not acceptable.",
        "Missing cache invalidation: always call `queryClient.invalidateQueries()` on mutation success.",
        "Use `useQuery`/`useMutation` from @tanstack/react-query — never use raw `fetch` or `axios`.",
    ],
    "frontend_ui": [
        "Missing conditional states: every data-fetching component must handle loading, error, and empty states.",
        "Spec card fields dropped: compare component fields with the original Lovable component — don't silently omit fields.",
        "Replace ALL `supabase.from()` calls with repository methods and ALL `supabase.auth` with AuthContext.",
        "Use Tailwind CSS variables (no hardcoded colors) and shadcn/ui components.",
    ],
    "storage": [
        "Storage buckets need equivalent S3/MinIO configuration in the monorepo.",
        "File upload endpoints need multipart form handling in FastAPI.",
        "Public URL generation must use the monorepo's storage service, not Supabase URLs.",
    ],
    "realtime": [
        "Replace `.channel().on()` with `refetchInterval` on React Query hooks.",
        "Choose appropriate interval: 5s for dashboards, 30s for lists, 60s for settings.",
        "Consider WebSocket upgrade path for latency-sensitive features.",
    ],
    "rpc": [
        "RPC functions must become service methods — stored procedure logic must be translated to Python.",
        "Complex SQL in RPCs may need raw SQLAlchemy queries via `session.execute(text(...))`.",
        "RPC return types must be mapped to Pydantic response schemas.",
    ],
}


class ClaudePromptBuilder:
    """Generates Claude Code prompts for each porting task phase."""

    # ── Type mapping (Gap 3 fix) ────────────────────────────────────

    def _map_ts_type(self, ts_type: str, col_name: str = "") -> tuple[str, str]:
        """Map TypeScript type to (python_type, sa_column_type).

        Context-aware: detects UUIDs from column names and floats from
        common naming patterns.
        """
        clean = ts_type.replace(" | null", "").strip()

        # UUID detection: *_id columns with string type
        if clean == "string" and col_name.endswith("_id"):
            return ("uuid.UUID", "UUID(as_uuid=True)")

        # Float detection: numeric columns with float-suggesting names
        if clean == "number":
            name_lower = col_name.lower()
            if any(p in name_lower for p in _FLOAT_PATTERNS):
                return ("float", "Float")
            return ("int", "Integer")

        pair = _TS_TO_SA.get(clean)
        if pair:
            return pair
        return ("str", "String")

    def _common_mistakes(self, phase: str) -> str:
        """Build a common-mistakes warning footer for a given phase."""
        mistakes = _PHASE_MISTAKES.get(phase, [])
        if not mistakes:
            return ""
        items = "\n".join(f"- ⚠️ {m}" for m in mistakes)
        return f"\n\n### Common Mistakes to Avoid\n{items}\n"

    # ── Model prompt ────────────────────────────────────────────────

    def build_model_prompt(
        self,
        domain: str,
        tables: list[ExtractedTable],
        rls_policies: list[ExtractedRLSPolicy],
    ) -> str:
        """Backend model + schema + migration prompt for a domain group."""
        sections: list[str] = []
        for table in tables:
            py_type, sa_type = "str", "String"  # defaults
            columns_text = "\n".join(
                f"    {c.name}: Mapped[{'Optional[' if c.nullable else ''}"
                f"{self._map_ts_type(c.type, c.name)[0]}"
                f"{']' if c.nullable else ''}] = mapped_column("
                f"{self._map_ts_type(c.type, c.name)[1]}, nullable={c.nullable})"
                for c in table.columns
            )
            sections.append(
                f"#### Table: `{table.name}`\n```python\n"
                f"class {table.name.title().replace('_', '')}(Base, UUIDMixin, TimestampMixin):\n"
                f"    __tablename__ = \"{table.name}\"\n\n{columns_text}\n```"
            )

        tables_text = "\n\n".join(sections) if sections else "No table definitions found."

        table_rls = [p for p in rls_policies if any(p.table == t.name for t in tables)]
        rls_text = "\n".join(
            f"  - {p.policy_name}: {p.operation} — {p.condition}"
            for p in table_rls
        ) if table_rls else "  No RLS policies found"

        # Relationship hints for multi-table domains
        relationship_hint = ""
        if len(tables) > 1:
            names = [t.name for t in tables]
            relationship_hint = (
                f"\n\n### Relationship Hints\n"
                f"This domain has {len(tables)} tables: {', '.join(names)}.\n"
                f"Add SQLAlchemy `relationship()` between related models. "
                f"Use `ForeignKey` on child tables pointing to the parent."
            )

        return f"""## Task: Create Backend Model + Schema for `{domain}`

### Step 1: Run scaffold
```bash
./scripts/scaffold-domain.sh {domain}
```

### Step 2: Define the SQLAlchemy models
File: `apps/api/models/{domain}.py`

{tables_text}
{relationship_hint}

### Step 3: Create Pydantic schemas
File: `apps/api/schemas/{domain}.py`
- Extend `BaseSchema` from `apps.api.schemas.base`
- Create Base, Create, Update, Response variants per table

### Step 4: Register in barrel files
- `apps/api/models/__init__.py` — import + add to __all__

### Step 5: Create Alembic migration
```bash
cd infra && alembic revision --autogenerate -m "add {domain} tables"
```

### RLS Policies (must become service-layer auth checks):
{rls_text}
{self._common_mistakes('backend_model')}"""

    # ── Service prompt ──────────────────────────────────────────────

    def build_service_prompt(
        self, domain: str, queries: list[ExtractedQuery],
        edge_fns: list[ExtractedEdgeFunction], rls: list[ExtractedRLSPolicy],
        rpc_calls: list[ExtractedRPC] | None = None,
        storage_buckets: list[ExtractedStorageBucket] | None = None,
    ) -> str:
        """Backend service + router prompt."""
        query_lines: list[str] = []
        for q in queries:
            filters_str = f" (filters: {', '.join(q.filters)})" if q.filters else ""
            query_lines.append(
                f"  - `{q.source_file}`: .from('{q.table}').{q.operation}({q.detail or ''}){filters_str}"
            )
        query_map = "\n".join(query_lines) if query_lines else "  No queries found"

        fn_map = "\n".join(
            f"  - `{fn.name}` called from: {', '.join(fn.callers) or 'N/A'}"
            for fn in edge_fns
        ) if edge_fns else "  No edge functions"

        auth_checks = "\n".join(
            f"  - {p.operation}: `{p.condition}` → add to service method"
            for p in rls
        ) if rls else "  No auth checks needed"

        rpc_section = ""
        if rpc_calls:
            rpc_items = "\n".join(
                f"  - `{r.function_name}({r.args or ''})` in {r.source_file}"
                for r in rpc_calls
            )
            rpc_section = f"\n\n### RPC calls (become service methods):\n{rpc_items}"

        storage_section = ""
        if storage_buckets:
            storage_items = "\n".join(
                f"  - bucket `{b.bucket_name}`: {', '.join(b.operations)} (in {b.source_file})"
                for b in storage_buckets
            )
            storage_section = f"\n\n### Storage operations (need file service):\n{storage_items}"

        return f"""## Task: Create Backend Service + Router for `{domain}`

### Service: `apps/api/services/{domain}_service.py`
Extend `BaseService` from `apps.api.services.base_service`.

Query patterns to implement as service methods:
{query_map}

Edge function mappings (become service methods):
{fn_map}
{rpc_section}
{storage_section}

### Router: `apps/api/routers/{domain}.py`
Follow pattern from `apps/api/routers/tasks.py`:
- GET / — list with filtering
- GET /{{id}} — get by ID
- POST / — create
- PATCH /{{id}} — update
- DELETE /{{id}} — delete

### Authorization checks (from RLS):
{auth_checks}

### Register in main.py:
```python
from apps.api.routers import {domain}
app.include_router({domain}.router, prefix="/{domain.replace('_', '-')}", tags=["{domain}"])
```
{self._common_mistakes('backend_service')}"""

    # ── Frontend types prompt ───────────────────────────────────────

    def build_frontend_types_prompt(
        self, domain: str, tables: list[ExtractedTable],
    ) -> str:
        """Frontend types + repository prompt for a domain group."""
        type_sections: list[str] = []
        for table in tables:
            fields = "\n".join(f"  {c.name}: {c.type};" for c in table.columns)
            type_sections.append(
                f"export interface {table.name.title().replace('_', '')} {{\n"
                f"  id: string;\n{fields}\n  created_at: string;\n  updated_at: string;\n}}"
            )
        types_text = "\n\n".join(type_sections) if type_sections else "// Define types manually"

        return f"""## Task: Create Frontend Types + Repository for `{domain}`

### Types: `apps/web/src/lib/types/{domain.replace('_', '-')}.ts`
```typescript
{types_text}
```

### Repository: `apps/web/src/lib/api/repositories/{domain.replace('_', '-')}.repository.ts`
Extend `BaseRepository` with `basePath = "/{domain.replace('_', '-')}"`.

### Register in barrel files:
- `apps/web/src/lib/types/index.ts` — re-export types
- `apps/web/src/lib/api/repositories/index.ts` — export repository class + singleton
{self._common_mistakes('frontend_types')}"""

    # ── Hooks prompt ────────────────────────────────────────────────

    def build_hooks_prompt(self, domain: str, hooks: list[ExtractedHook]) -> str:
        """Frontend hooks prompt."""
        hook_list = "\n".join(
            f"  - `{h.name}` ({h.hook_type}) — tables: {h.table_deps}, fns: {h.fn_deps}"
            for h in hooks
        ) if hooks else "  No hooks to port"
        return f"""## Task: Create Frontend Hooks for `{domain}`

### Query hooks: `apps/web/src/hooks/queries/use{domain.title().replace('_', '')}.ts`
### Mutation hooks: `apps/web/src/hooks/mutations/use{domain.title().replace('_', '')}Mutations.ts`

Hooks to port:
{hook_list}

Follow patterns from `useTaskMutations.ts`:
- Use `useQuery`/`useMutation` from @tanstack/react-query
- Import repository singleton from `@/lib/api/repositories`
- Invalidate query cache on mutation success
- Show toast on success/error
{self._common_mistakes('frontend_hooks')}"""

    # ── UI prompt ───────────────────────────────────────────────────

    def build_ui_prompt(
        self, domain: str, components: list[ExtractedComponent],
        routes: list[ExtractedRoute],
    ) -> str:
        """UI components + pages prompt."""
        comp_list = "\n".join(
            f"  - `{c.name}` ({c.loc} LOC) — Supabase deps: {c.supabase_deps or 'none'}"
            for c in components
        ) if components else "  No components to port"
        route_list = "\n".join(
            f"  - `{r.path}` → {r.component} (protected: {r.protected})"
            for r in routes
        ) if routes else "  No routes to port"
        return f"""## Task: Create UI Components + Pages for `{domain}`

### Components to port:
{comp_list}

### Routes to create:
{route_list}

### Guidelines:
- Use shadcn/ui components (Card, Button, Badge, Tabs)
- Use Tailwind CSS variables (no hardcoded colors)
- Use lucide-react icons
- Follow Atomic Design: atoms → molecules → organisms
- Place pages in `apps/web/src/app/(app)/`
- Replace all `supabase.from()` calls with repository methods
- Replace `supabase.auth` with AuthContext
{self._common_mistakes('frontend_ui')}"""

    # ── Cross-cutting prompts ───────────────────────────────────────

    def build_setup_prompt(self, domains: list[str]) -> str:
        """Cross-cutting setup task prompt."""
        model_imports = "\n".join(
            f"from .{d} import {d.title().replace('_', '')}" for d in domains
        )
        return f"""## Task: Register All Domains in Barrel Files

### 1. `apps/api/models/__init__.py`
Add imports:
```python
{model_imports}
```
Add each to `__all__`.

### 2. `apps/api/main.py`
Register each router with `app.include_router(...)`.

### 3. `apps/web/src/lib/types/index.ts`
Re-export all domain types.

### 4. `apps/web/src/lib/api/repositories/index.ts`
Export all repository classes and singletons.

### Data Migration Note
Lovable Cloud exports table data as CSV only (not pg_dump). This means no
foreign key references, sequences, or defaults in the export. Use Alembic
migration files for schema creation and manually import CSV data afterward.
"""

    def build_auth_prompt(self, auth_patterns: list[ExtractedAuth]) -> str:
        """Auth wiring task prompt."""
        patterns = "\n".join(
            f"  - `{a.pattern}` in {a.source_file}"
            for a in auth_patterns
        ) if auth_patterns else "  No auth patterns found"
        return f"""## Task: Wire Authentication

### Auth patterns found in Lovable source:
{patterns}

### Mapping to monorepo:
- `supabase.auth.getUser()` → `CurrentUser` dependency in FastAPI
- `supabase.auth.getSession()` → JWT in `Authorization: Bearer` header
- `supabase.auth.signIn*()` → POST /auth/login endpoint
- `supabase.auth.signUp()` → POST /auth/register endpoint
- `supabase.auth.signOut()` → Clear token client-side

### Frontend:
- Use `useAuth()` from `@/contexts/AuthContext`
- Token stored via `apiClient` interceptor

### ⚠️ Password Migration Warning
User passwords **cannot be exported** from Lovable Cloud. You MUST implement
a password reset flow for existing users. Add a POST /auth/reset-password
endpoint and send reset emails on first login attempt after migration.
"""

    def build_verify_prompt(self) -> str:
        """Verification task prompt."""
        return """## Task: Run Port Verification

### Run all verification commands:
```bash
# No leftover Supabase references
grep -r "supabase" apps/web/src/ apps/api/ --include="*.ts" --include="*.tsx" --include="*.py" | grep -v node_modules

# No stubs
grep -rn "TODO\\|FIXME\\|stub\\|NotImplementedError" apps/web/src/ apps/api/ --include="*.ts" --include="*.tsx" --include="*.py"

# No direct API calls in components/hooks
grep -rn "fetch(\\|axios\\." apps/web/src/components/ apps/web/src/hooks/ --include="*.ts" --include="*.tsx"

# Build checks
make typecheck && make lint
```

### Checklist:
- [ ] All routers registered in main.py
- [ ] All models registered in models/__init__.py
- [ ] All types exported from types/index.ts
- [ ] All repositories exported from repositories/index.ts
- [ ] No hardcoded Supabase URLs/keys
- [ ] All RLS policies translated to service-layer auth
- [ ] All .rpc() calls translated to service methods
- [ ] All .storage calls replaced with file service
- [ ] All .channel().on() replaced with refetchInterval

### ⚠️ Post-Migration Warning
After verifying the port, **disconnect from Lovable** to prevent sync issues.
Your Lovable project remains connected to the original Lovable Cloud database.
Any changes made in Lovable after migration will NOT sync to the monorepo.
If you transfer the GitHub repo to a different org, Lovable sync breaks permanently.
"""

    # ── New cross-cutting prompts (Gap 5) ───────────────────────────

    def build_storage_prompt(
        self, storage_buckets: list[ExtractedStorageBucket],
    ) -> str:
        """Storage migration task prompt."""
        bucket_list = "\n".join(
            f"  - `{b.bucket_name}`: {', '.join(b.operations)} (in {b.source_file})"
            for b in storage_buckets
        )
        return f"""## Task: Migrate Storage from Supabase to S3/MinIO

### Storage buckets found:
{bucket_list}

### Choose your migration path:

#### Path A: S3-Compatible Backend (Recommended)
Supabase Storage is S3-compatible under the hood. If your target uses S3 or
MinIO, migration is mostly reconfiguring environment variables:
1. Set `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` env vars
2. Point them at your S3/MinIO instance instead of Supabase
3. Create a thin `apps/api/services/storage_service.py` using `boto3` with the
   same bucket names — existing file paths stay the same
4. Only rewrite frontend calls that use `.getPublicUrl()` (presigned URLs differ)

#### Path B: Custom Storage Service (Full Rewrite)
Use this if you need a completely different storage backend (local disk, GCS, etc.):
1. Create `apps/api/services/storage_service.py` with upload/download/delete methods
2. Add configuration to `apps/api/config.py`
3. Create file upload router at `apps/api/routers/files.py` with multipart form endpoints
4. Generate presigned URLs for downloads instead of public Supabase URLs
5. Create `apps/web/src/lib/api/repositories/files.repository.ts`
6. Replace all `supabase.storage.from()` calls with file repository methods

### Supabase → Monorepo mapping:
- `.storage.from("bucket").upload()` → `POST /files/upload` (multipart)
- `.storage.from("bucket").download()` → `GET /files/{{id}}/download`
- `.storage.from("bucket").getPublicUrl()` → `GET /files/{{id}}/url`
- `.storage.from("bucket").remove()` → `DELETE /files/{{id}}`
{self._common_mistakes('storage')}"""

    def build_realtime_prompt(
        self, realtime_subs: list[ExtractedRealtimeSubscription],
    ) -> str:
        """Realtime migration task prompt."""
        sub_list = "\n".join(
            f"  - channel `{s.channel_name}` → table: {s.table or 'N/A'}, "
            f"event: {s.event or 'N/A'} (in {s.source_file})"
            for s in realtime_subs
        )
        return f"""## Task: Migrate Realtime Subscriptions to Polling

### Realtime subscriptions found:
{sub_list}

### Migration strategy:
Replace each `.channel().on()` subscription with `refetchInterval` on the
corresponding React Query hook:

```typescript
// Before (Supabase realtime):
supabase.channel("changes").on("postgres_changes", {{ table: "tasks" }}, callback)

// After (React Query polling):
useQuery({{
  queryKey: ["tasks"],
  queryFn: () => tasksRepository.getAll(),
  refetchInterval: 5000, // 5s for active dashboards
}})
```

### Recommended intervals:
- Dashboard/active views: 5,000ms (5s)
- List views: 30,000ms (30s)
- Settings/config pages: 60,000ms (60s)
- Consider WebSocket upgrade for latency-sensitive features

### staleTime Configuration (Critical)
Always set `staleTime` alongside `refetchInterval` to prevent over-fetching.
Without `staleTime`, React Query treats data as stale immediately, causing
unnecessary refetches on every component mount and window focus:

```typescript
useQuery({{
  queryKey: ["tasks"],
  queryFn: () => tasksRepository.getAll(),
  refetchInterval: 5000,
  staleTime: 60_000,  // Data stays "fresh" for 60s — prevents refetch on mount/focus
}})
```

Recommended `staleTime`: 60,000ms (60s) for most cases. Only use `staleTime: 0`
for data that must always be live (e.g., chat messages).
{self._common_mistakes('realtime')}"""

    def build_rpc_prompt(self, rpc_calls: list[ExtractedRPC]) -> str:
        """RPC migration task prompt."""
        rpc_list = "\n".join(
            f"  - `{r.function_name}({r.args or ''})` in {r.source_file}"
            for r in rpc_calls
        )
        return f"""## Task: Migrate RPC Calls to Service Methods

### RPC calls found:
{rpc_list}

### Migration strategy:
Each `.rpc("fn_name")` call maps to a service method + router endpoint:

1. **Find the SQL function** in `supabase/migrations/*.sql` (look for `CREATE FUNCTION fn_name`)
2. **Translate SQL logic** to a Python service method
3. **Create router endpoint** that calls the service method
4. **Update frontend** to call the new endpoint via repository

### Backend pattern:
```python
# Service method
async def fn_name(self, session: AsyncSession, **params) -> result_type:
    # Translate SQL logic to SQLAlchemy queries
    stmt = select(Model).where(...)
    result = await session.execute(stmt)
    return result.scalars().all()

# Router endpoint
@router.post("/fn-name")
async def fn_name_endpoint(params: FnNameRequest, session: DbSession):
    return await service.fn_name(session, **params.model_dump())
```

### Frontend pattern:
```typescript
// Repository method
async fnName(params: FnNameParams): Promise<FnNameResponse> {{
  return this.post("/fn-name", params);
}}
```
{self._common_mistakes('rpc')}"""

    # ── Schema review prompt (pre-scaffold) ────────────────────────

    def build_schema_review_prompt(
        self, domain_table_map: dict[str, list[str]],
    ) -> str:
        """Schema review task prompt — order 0, before scaffold."""
        domain_lines = "\n".join(
            f"  - **{domain}**: {', '.join(tables)}"
            for domain, tables in sorted(domain_table_map.items())
        )
        return f"""## Task: Review Schema & Domain Mapping

### Purpose
Before generating any code, review the domain→table mapping below and confirm
it matches your intended architecture. Frequent schema changes break generated
queries and cause constant rework.

### Proposed domain groupings:
{domain_lines}

### Review checklist:
- [ ] Each domain groups related tables correctly
- [ ] No table is missing from the mapping
- [ ] Join/bridge tables are in the right domain
- [ ] Domain names match your intended API route prefixes
- [ ] Foreign key relationships between domains are identified

### Action required:
1. Review the mapping above
2. Adjust domain assignments if needed (edit the manifest)
3. Confirm before proceeding to scaffold generation

⚠️ Skipping this review is the #1 cause of rework in Lovable migrations.
"""

    # ── Environment variable audit prompt ──────────────────────────

    def build_env_audit_prompt(self, env_vars: list[ExtractedEnvVar]) -> str:
        """Environment variable audit task prompt."""
        var_list = "\n".join(
            f"  - `{v.prefix}{v.name}` (found in {v.source_file})"
            for v in env_vars
        )
        return f"""## Task: Audit & Recreate Environment Variables

### ⚠️ Critical Warning
Lovable Cloud does **not** export API keys, secrets, or environment variables.
You must manually recreate every env var in your deployment environment.

### Environment variables found in source:
{var_list}

### Action required:
1. For each variable above, determine if it's still needed in the monorepo
2. Supabase-specific vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) should
   be replaced with monorepo equivalents (`API_BASE_URL`, `JWT_SECRET`, etc.)
3. Third-party API keys (Stripe, SendGrid, etc.) must be obtained from the
   respective service dashboards and added to your `.env` file
4. Add all required vars to `.env.example` with placeholder values
5. Update `apps/api/config.py` to read any new backend env vars

### Checklist:
- [ ] All Supabase vars replaced with monorepo equivalents
- [ ] All third-party API keys obtained and configured
- [ ] `.env.example` updated with all required vars
- [ ] No hardcoded keys or secrets in source code
"""
