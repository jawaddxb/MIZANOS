"""Generates porting tasks from a LovableManifest."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.task import Task
from apps.api.schemas.lovable_manifest import LovableManifest
from apps.api.services.claude_prompt_builder import ClaudePromptBuilder

# Estimated hours per phase
_PHASE_HOURS: dict[str, float] = {
    "scaffold": 0.5,
    "backend_model": 1.0,
    "backend_service": 2.0,
    "frontend_types": 0.5,
    "frontend_hooks": 1.0,
    "frontend_ui": 2.0,
    "auth": 1.5,
    "storage": 2.0,
    "realtime": 1.0,
    "rpc": 1.5,
    "schema_review": 0.5,
    "env_audit": 0.5,
    "verify": 0.5,
}


class PortTaskGenerator:
    """Creates Task records from a Lovable extraction manifest."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.prompt_builder = ClaudePromptBuilder()

    async def generate_tasks(
        self, manifest: LovableManifest, product_id: UUID,
    ) -> list[Task]:
        """Generate all porting tasks for a product.

        Task ordering (Gap 6):
        1. Scaffold/setup (order 0)
        2. Per-domain: backend_model → backend_service → frontend_types → hooks → UI
        3. Cross-cutting: auth, storage, realtime, rpc (conditional)
        4. Verification (last)
        """
        tasks: list[Task] = []
        order = 0

        # ── 0. Schema review (pre-scaffold) ─────────────────────────
        if manifest.domain_table_map:
            schema_review_task = Task(
                product_id=product_id,
                title="[review] Confirm schema & domain mapping",
                description=(
                    "Review the extracted domain→table mapping before generating "
                    "any code. Adjust groupings if needed to prevent rework."
                ),
                status="backlog",
                priority="high",
                pillar="development",
                sort_order=order,
                estimated_hours=_PHASE_HOURS["schema_review"],
                generation_source="lovable_port",
                claude_code_prompt=self.prompt_builder.build_schema_review_prompt(
                    manifest.domain_table_map,
                ),
                domain_group="review",
                phase="schema_review",
                is_draft=True,
            )
            self.session.add(schema_review_task)
            tasks.append(schema_review_task)
            order += 1

        # ── 1. Scaffold/setup first ─────────────────────────────────
        setup_task = Task(
            product_id=product_id,
            title="[setup] Scaffold all domains + register barrel files",
            description=(
                "Run scaffold script for each domain and register all models, "
                "routers, types, and repositories in barrel/index files."
            ),
            status="backlog",
            priority="high",
            pillar="development",
            sort_order=order,
            estimated_hours=_PHASE_HOURS["scaffold"],
            generation_source="lovable_port",
            claude_code_prompt=self.prompt_builder.build_setup_prompt(
                manifest.domains
            ),
            domain_group="setup",
            phase="scaffold",
            is_draft=True,
        )
        self.session.add(setup_task)
        tasks.append(setup_task)
        order += 1

        # ── 2. Per-domain tasks (ordered by phase across domains) ───
        # Process all domains through each phase before moving to next phase
        domain_table_map = manifest.domain_table_map

        for phase_name, phase_builder in [
            ("backend_model", self._build_model_task),
            ("backend_service", self._build_service_task),
            ("frontend_types", self._build_types_task),
            ("frontend_hooks", self._build_hooks_task),
            ("frontend_ui", self._build_ui_task),
        ]:
            for domain in manifest.domains:
                domain_tables_names = domain_table_map.get(domain, [])
                task = phase_builder(
                    manifest, domain, domain_tables_names, product_id, order,
                )
                self.session.add(task)
                tasks.append(task)
                order += 1

        # ── 3. Cross-cutting tasks (conditional) ────────────────────
        cross_cutting = self._build_cross_cutting_tasks(
            manifest, product_id, order,
        )
        for task in cross_cutting:
            self.session.add(task)
            tasks.append(task)
            order += 1

        await self.session.flush()
        return tasks

    # ── Per-domain task builders ────────────────────────────────────

    def _get_domain_tables(
        self, manifest: LovableManifest, table_names: list[str],
    ) -> list:
        """Get ExtractedTable objects for the given table names."""
        return [t for t in manifest.tables if t.name in table_names]

    def _build_model_task(
        self, manifest: LovableManifest, domain: str,
        table_names: list[str], product_id: UUID, order: int,
    ) -> Task:
        """Backend model + schema + migration task."""
        tables = self._get_domain_tables(manifest, table_names)
        rls = [r for r in manifest.rls_policies if r.table in table_names]

        col_summary = ""
        if tables:
            all_cols = [c.name for t in tables for c in t.columns[:6]]
            col_summary = ", ".join(all_cols[:10])
            total = sum(len(t.columns) for t in tables)
            if total > 10:
                col_summary += f" (+{total - 10} more)"

        prompt = (
            self.prompt_builder.build_model_prompt(domain, tables, rls)
            if tables
            else f"No table definitions found for {domain}. Create model manually."
        )

        return Task(
            product_id=product_id,
            title=f"[{domain}] Backend: Model + Schema + Migration",
            description=(
                f"Create SQLAlchemy models, Pydantic schemas, and Alembic migration "
                f"for the `{domain}` domain.\n\n"
                f"Tables: {', '.join(table_names) or 'none'}\n"
                f"Columns: {col_summary}\nRLS policies: {len(rls)}\n\n"
                f"Extend Base, UUIDMixin, TimestampMixin."
            ),
            status="backlog",
            priority="high",
            pillar="development",
            sort_order=order,
            estimated_hours=_PHASE_HOURS["backend_model"] * max(1, len(tables)),
            generation_source="lovable_port",
            claude_code_prompt=prompt,
            domain_group=domain,
            phase="backend_model",
            is_draft=True,
        )

    def _build_service_task(
        self, manifest: LovableManifest, domain: str,
        table_names: list[str], product_id: UUID, order: int,
    ) -> Task:
        """Backend service + router task."""
        queries = [q for q in manifest.queries if q.table in table_names]
        rls = [r for r in manifest.rls_policies if r.table in table_names]
        edge_fns = [
            fn for fn in manifest.edge_functions
            if any(tn in c for c in fn.callers for tn in table_names)
        ]
        rpc_calls = [
            r for r in manifest.rpc_calls
            if any(tn in r.function_name for tn in table_names)
        ]
        storage_buckets = [
            b for b in manifest.storage_buckets
            if any(tn in b.source_file for tn in table_names)
        ]

        return Task(
            product_id=product_id,
            title=f"[{domain}] Backend: Service + Router",
            description=(
                f"Create service (extending BaseService) and router for `{domain}`.\n\n"
                f"Queries to port: {len(queries)}\n"
                f"Edge functions: {len(edge_fns)}\n"
                f"RPC calls: {len(rpc_calls)}\n"
                f"Auth checks from RLS: {len(rls)}"
            ),
            status="backlog",
            priority="high",
            pillar="development",
            sort_order=order,
            estimated_hours=_PHASE_HOURS["backend_service"],
            generation_source="lovable_port",
            claude_code_prompt=self.prompt_builder.build_service_prompt(
                domain, queries, edge_fns, rls,
                rpc_calls=rpc_calls or None,
                storage_buckets=storage_buckets or None,
            ),
            domain_group=domain,
            phase="backend_service",
            is_draft=True,
        )

    def _build_types_task(
        self, manifest: LovableManifest, domain: str,
        table_names: list[str], product_id: UUID, order: int,
    ) -> Task:
        """Frontend types + repository task."""
        tables = self._get_domain_tables(manifest, table_names)

        col_summary = ""
        if tables:
            all_cols = [c.name for t in tables for c in t.columns[:6]]
            col_summary = ", ".join(all_cols[:10])

        prompt = (
            self.prompt_builder.build_frontend_types_prompt(domain, tables)
            if tables
            else f"No table found for {domain}. Create types manually."
        )

        return Task(
            product_id=product_id,
            title=f"[{domain}] Frontend: Types + Repository",
            description=(
                f"Create TypeScript interfaces and repository class for `{domain}`.\n\n"
                f"Tables: {', '.join(table_names) or 'none'}\n"
                f"Columns: {col_summary}\n"
                f"Extend BaseRepository with basePath matching router prefix."
            ),
            status="backlog",
            priority="medium",
            pillar="development",
            sort_order=order,
            estimated_hours=_PHASE_HOURS["frontend_types"],
            generation_source="lovable_port",
            claude_code_prompt=prompt,
            domain_group=domain,
            phase="frontend_types",
            is_draft=True,
        )

    def _build_hooks_task(
        self, manifest: LovableManifest, domain: str,
        table_names: list[str], product_id: UUID, order: int,
    ) -> Task:
        """Frontend hooks task."""
        hooks = [
            h for h in manifest.hooks
            if any(tn in h.table_deps or tn in h.fn_deps for tn in table_names)
        ]
        return Task(
            product_id=product_id,
            title=f"[{domain}] Frontend: Query + Mutation Hooks",
            description=(
                f"Create React Query hooks for `{domain}`.\n\n"
                f"Hooks to port: {len(hooks)}\n"
                f"Follow useTaskMutations.ts pattern."
            ),
            status="backlog",
            priority="medium",
            pillar="development",
            sort_order=order,
            estimated_hours=_PHASE_HOURS["frontend_hooks"],
            generation_source="lovable_port",
            claude_code_prompt=self.prompt_builder.build_hooks_prompt(domain, hooks),
            domain_group=domain,
            phase="frontend_hooks",
            is_draft=True,
        )

    def _build_ui_task(
        self, manifest: LovableManifest, domain: str,
        table_names: list[str], product_id: UUID, order: int,
    ) -> Task:
        """UI components + pages task."""
        components = [
            c for c in manifest.components
            if any(tn in c.supabase_deps for tn in table_names)
        ]
        routes = [
            r for r in manifest.routes
            if any(tn.replace("_", "") in r.component.lower() for tn in table_names)
        ]
        return Task(
            product_id=product_id,
            title=f"[{domain}] UI: Components + Pages",
            description=(
                f"Create React components and pages for `{domain}`.\n\n"
                f"Components: {len(components)}\n"
                f"Routes: {len(routes)}\n"
                f"Use shadcn/ui + Tailwind + lucide-react."
            ),
            status="backlog",
            priority="low",
            pillar="development",
            sort_order=order,
            estimated_hours=_PHASE_HOURS["frontend_ui"],
            generation_source="lovable_port",
            claude_code_prompt=self.prompt_builder.build_ui_prompt(
                domain, components, routes,
            ),
            domain_group=domain,
            phase="frontend_ui",
            is_draft=True,
        )

    # ── Cross-cutting tasks ─────────────────────────────────────────

    def _build_cross_cutting_tasks(
        self, manifest: LovableManifest, product_id: UUID, start_order: int,
    ) -> list[Task]:
        """Build auth, storage, realtime, rpc, and verification tasks."""
        tasks: list[Task] = []
        order = start_order

        # Auth task
        if manifest.auth_patterns:
            tasks.append(Task(
                product_id=product_id,
                title="[setup] Auth wiring",
                description=(
                    f"Wire authentication: {len(manifest.auth_patterns)} "
                    f"auth patterns found in Lovable source."
                ),
                status="backlog",
                priority="high",
                pillar="development",
                sort_order=order,
                estimated_hours=_PHASE_HOURS["auth"],
                generation_source="lovable_port",
                claude_code_prompt=self.prompt_builder.build_auth_prompt(
                    manifest.auth_patterns,
                ),
                domain_group="setup",
                phase="auth",
                is_draft=True,
            ))
            order += 1

        # Storage migration task (conditional — Gap 5)
        if manifest.storage_buckets:
            tasks.append(Task(
                product_id=product_id,
                title="[infra] Migrate storage from Supabase to S3/MinIO",
                description=(
                    f"Set up file storage service: {len(manifest.storage_buckets)} "
                    f"storage bucket usage(s) found. Buckets: "
                    f"{', '.join(set(b.bucket_name for b in manifest.storage_buckets))}"
                ),
                status="backlog",
                priority="high",
                pillar="development",
                sort_order=order,
                estimated_hours=_PHASE_HOURS["storage"],
                generation_source="lovable_port",
                claude_code_prompt=self.prompt_builder.build_storage_prompt(
                    manifest.storage_buckets,
                ),
                domain_group="infra",
                phase="storage",
                is_draft=True,
            ))
            order += 1

        # Realtime migration task (conditional — Gap 5)
        if manifest.realtime_subscriptions:
            tasks.append(Task(
                product_id=product_id,
                title="[infra] Migrate realtime subscriptions to polling",
                description=(
                    f"Replace {len(manifest.realtime_subscriptions)} realtime "
                    f"subscription(s) with React Query refetchInterval polling."
                ),
                status="backlog",
                priority="medium",
                pillar="development",
                sort_order=order,
                estimated_hours=_PHASE_HOURS["realtime"],
                generation_source="lovable_port",
                claude_code_prompt=self.prompt_builder.build_realtime_prompt(
                    manifest.realtime_subscriptions,
                ),
                domain_group="infra",
                phase="realtime",
                is_draft=True,
            ))
            order += 1

        # RPC migration task (conditional — Gap 5)
        if manifest.rpc_calls:
            tasks.append(Task(
                product_id=product_id,
                title="[infra] Migrate RPC calls to service methods",
                description=(
                    f"Translate {len(manifest.rpc_calls)} Supabase .rpc() "
                    f"call(s) to FastAPI service methods. Functions: "
                    f"{', '.join(set(r.function_name for r in manifest.rpc_calls))}"
                ),
                status="backlog",
                priority="medium",
                pillar="development",
                sort_order=order,
                estimated_hours=_PHASE_HOURS["rpc"],
                generation_source="lovable_port",
                claude_code_prompt=self.prompt_builder.build_rpc_prompt(
                    manifest.rpc_calls,
                ),
                domain_group="infra",
                phase="rpc",
                is_draft=True,
            ))
            order += 1

        # Env var audit task (conditional)
        if manifest.env_vars:
            tasks.append(Task(
                product_id=product_id,
                title="[infra] Audit & recreate environment variables",
                description=(
                    f"Lovable does not export env vars. {len(manifest.env_vars)} "
                    f"environment variable reference(s) found in source. "
                    f"Vars: {', '.join(v.name for v in manifest.env_vars[:10])}"
                    + (f" (+{len(manifest.env_vars) - 10} more)"
                       if len(manifest.env_vars) > 10 else "")
                ),
                status="backlog",
                priority="high",
                pillar="development",
                sort_order=order,
                estimated_hours=_PHASE_HOURS["env_audit"],
                generation_source="lovable_port",
                claude_code_prompt=self.prompt_builder.build_env_audit_prompt(
                    manifest.env_vars,
                ),
                domain_group="infra",
                phase="env_audit",
                is_draft=True,
            ))
            order += 1

        # Verify task (always last)
        tasks.append(Task(
            product_id=product_id,
            title="[verify] Run port verification",
            description="Run all verification commands to ensure port is complete.",
            status="backlog",
            priority="medium",
            pillar="development",
            sort_order=order,
            estimated_hours=_PHASE_HOURS["verify"],
            generation_source="lovable_port",
            claude_code_prompt=self.prompt_builder.build_verify_prompt(),
            domain_group="verify",
            phase="verify",
            is_draft=True,
        ))

        return tasks
