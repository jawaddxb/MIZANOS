"""Lovable project extractor — scans source to produce a LovableManifest."""

import re
from pathlib import Path

from apps.api.schemas.lovable_manifest import (
    ColumnDef, ExtractedAuth, ExtractedComponent, ExtractedEdgeFunction,
    ExtractedEnvVar, ExtractedHook, ExtractedQuery, ExtractedRLSPolicy,
    ExtractedRPC, ExtractedRealtimeSubscription, ExtractedRoute,
    ExtractedStorageBucket, ExtractedTable, LovableManifest, ManifestSummary,
)

# Chained filter methods that indicate query complexity
_FILTER_METHODS = {"eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
                   "is", "in", "order", "limit", "single", "maybeSingle",
                   "range", "contains", "containedBy", "match", "not",
                   "or", "filter", "textSearch"}

_FILTER_RE = re.compile(r'\.(' + '|'.join(_FILTER_METHODS) + r')\(')


class LovableExtractor:
    """Extracts structured manifest from a Lovable/Supabase project."""

    # ── Table extraction ────────────────────────────────────────────

    def extract_tables(self, source_path: Path) -> list[ExtractedTable]:
        """Parse src/integrations/supabase/types.ts for table definitions."""
        types_file = source_path / "src" / "integrations" / "supabase" / "types.ts"
        if not types_file.exists():
            return []
        content = types_file.read_text()
        tables = []
        table_pattern = re.compile(
            r'(\w+):\s*\{[^}]*Row:\s*\{([^}]+)\}', re.DOTALL
        )
        for match in table_pattern.finditer(content):
            table_name = match.group(1)
            cols_text = match.group(2)
            columns = []
            col_pattern = re.compile(r'(\w+)\s*:\s*([^;\n]+)')
            for col_match in col_pattern.finditer(cols_text):
                col_name = col_match.group(1)
                col_type = col_match.group(2).strip()
                nullable = "null" in col_type.lower()
                columns.append(ColumnDef(name=col_name, type=col_type, nullable=nullable))
            tables.append(ExtractedTable(name=table_name, columns=columns))
        return tables

    # ── Query extraction (enriched with filters) ────────────────────

    def extract_queries(self, source_path: Path) -> list[ExtractedQuery]:
        """Grep .ts/.tsx files for .from() Supabase query calls with filters."""
        queries = []
        src_dir = source_path / "src"
        if not src_dir.exists():
            return []
        pattern = re.compile(
            r'\.from\(["\'](\w+)["\']\)\s*\.(select|insert|update|delete|upsert)\(([^)]*)\)'
        )
        for ts_file in src_dir.rglob("*.ts*"):
            if "node_modules" in str(ts_file):
                continue
            try:
                content = ts_file.read_text()
            except (UnicodeDecodeError, PermissionError):
                continue
            for match in pattern.finditer(content):
                # Look ahead for chained filter calls
                rest = content[match.end():match.end() + 500]
                filters = [m.group(1) for m in _FILTER_RE.finditer(rest)]
                queries.append(ExtractedQuery(
                    source_file=str(ts_file.relative_to(source_path)),
                    table=match.group(1),
                    operation=match.group(2),
                    detail=match.group(3).strip() or None,
                    filters=filters,
                ))
        return queries

    # ── RPC extraction ──────────────────────────────────────────────

    def extract_rpc_calls(self, source_path: Path) -> list[ExtractedRPC]:
        """Grep for .rpc("fn_name") calls."""
        rpcs: list[ExtractedRPC] = []
        src_dir = source_path / "src"
        if not src_dir.exists():
            return []
        rpc_re = re.compile(r'\.rpc\(["\'](\w+)["\'](?:,\s*(\{[^}]*\}))?\)')
        for ts_file in src_dir.rglob("*.ts*"):
            if "node_modules" in str(ts_file):
                continue
            try:
                content = ts_file.read_text()
            except (UnicodeDecodeError, PermissionError):
                continue
            for match in rpc_re.finditer(content):
                rpcs.append(ExtractedRPC(
                    function_name=match.group(1),
                    source_file=str(ts_file.relative_to(source_path)),
                    args=match.group(2),
                ))
        return rpcs

    # ── Storage extraction ──────────────────────────────────────────

    def extract_storage_buckets(self, source_path: Path) -> list[ExtractedStorageBucket]:
        """Grep for .storage.from("bucket") calls."""
        buckets_map: dict[str, ExtractedStorageBucket] = {}
        src_dir = source_path / "src"
        if not src_dir.exists():
            return []
        storage_re = re.compile(
            r'\.storage\s*\.from\(["\'](\w+)["\']\)\s*\.(upload|download|getPublicUrl|remove|list|createSignedUrl)\('
        )
        for ts_file in src_dir.rglob("*.ts*"):
            if "node_modules" in str(ts_file):
                continue
            try:
                content = ts_file.read_text()
            except (UnicodeDecodeError, PermissionError):
                continue
            for match in storage_re.finditer(content):
                bucket = match.group(1)
                operation = match.group(2)
                source = str(ts_file.relative_to(source_path))
                key = f"{bucket}:{source}"
                if key not in buckets_map:
                    buckets_map[key] = ExtractedStorageBucket(
                        bucket_name=bucket, source_file=source,
                    )
                if operation not in buckets_map[key].operations:
                    buckets_map[key].operations.append(operation)
        return list(buckets_map.values())

    # ── Realtime extraction ─────────────────────────────────────────

    def extract_realtime_subscriptions(
        self, source_path: Path,
    ) -> list[ExtractedRealtimeSubscription]:
        """Grep for .channel().on() realtime subscriptions."""
        subs: list[ExtractedRealtimeSubscription] = []
        src_dir = source_path / "src"
        if not src_dir.exists():
            return []
        channel_re = re.compile(
            r'\.channel\(["\']([^"\']+)["\']\)'
        )
        on_re = re.compile(
            r'\.on\(\s*["\']?(\w+)["\']?\s*,'
            r'\s*\{[^}]*(?:table:\s*["\'](\w+)["\'])?[^}]*(?:event:\s*["\'](\w+)["\'])?[^}]*\}'
        )
        for ts_file in src_dir.rglob("*.ts*"):
            if "node_modules" in str(ts_file):
                continue
            try:
                content = ts_file.read_text()
            except (UnicodeDecodeError, PermissionError):
                continue
            for ch_match in channel_re.finditer(content):
                channel_name = ch_match.group(1)
                rest = content[ch_match.end():ch_match.end() + 500]
                on_match = on_re.search(rest)
                table = on_match.group(2) if on_match and on_match.group(2) else None
                event = on_match.group(3) if on_match and on_match.group(3) else None
                subs.append(ExtractedRealtimeSubscription(
                    channel_name=channel_name,
                    source_file=str(ts_file.relative_to(source_path)),
                    table=table,
                    event=event,
                ))
        return subs

    # ── Environment variable extraction ──────────────────────────────

    def extract_env_vars(self, source_path: Path) -> list[ExtractedEnvVar]:
        """Grep for process.env.* and import.meta.env.* references."""
        env_vars_map: dict[str, ExtractedEnvVar] = {}
        src_dir = source_path / "src"
        if not src_dir.exists():
            return []
        env_re = re.compile(
            r'(?:process\.env\.([\w]+)|import\.meta\.env\.([\w]+))'
        )
        for ts_file in src_dir.rglob("*.ts*"):
            if "node_modules" in str(ts_file):
                continue
            try:
                content = ts_file.read_text()
            except (UnicodeDecodeError, PermissionError):
                continue
            for match in env_re.finditer(content):
                proc_name = match.group(1)
                meta_name = match.group(2)
                name = proc_name or meta_name
                prefix = "process.env." if proc_name else "import.meta.env."
                if name not in env_vars_map:
                    env_vars_map[name] = ExtractedEnvVar(
                        name=name,
                        source_file=str(ts_file.relative_to(source_path)),
                        prefix=prefix,
                    )
        return list(env_vars_map.values())

    # ── Existing extractors ─────────────────────────────────────────

    def extract_edge_functions(self, source_path: Path) -> list[ExtractedEdgeFunction]:
        """Scan supabase/functions/ + grep for .functions.invoke() calls."""
        functions: list[ExtractedEdgeFunction] = []
        fn_dir = source_path / "supabase" / "functions"
        fn_names: set[str] = set()
        if fn_dir.exists():
            for child in fn_dir.iterdir():
                if child.is_dir():
                    fn_names.add(child.name)
        invoke_pattern = re.compile(r'\.functions\.invoke\(["\'](\w+)["\']')
        caller_map: dict[str, list[str]] = {name: [] for name in fn_names}
        src_dir = source_path / "src"
        if src_dir.exists():
            for ts_file in src_dir.rglob("*.ts*"):
                if "node_modules" in str(ts_file):
                    continue
                try:
                    content = ts_file.read_text()
                except (UnicodeDecodeError, PermissionError):
                    continue
                for match in invoke_pattern.finditer(content):
                    name = match.group(1)
                    fn_names.add(name)
                    caller_map.setdefault(name, []).append(
                        str(ts_file.relative_to(source_path))
                    )
        for name in fn_names:
            functions.append(ExtractedEdgeFunction(
                name=name, callers=caller_map.get(name, [])
            ))
        return functions

    def extract_auth_patterns(self, source_path: Path) -> list[ExtractedAuth]:
        """Grep for supabase.auth.* calls."""
        patterns: list[ExtractedAuth] = []
        auth_re = re.compile(r'supabase\.auth\.(\w+)\(([^)]*)\)')
        src_dir = source_path / "src"
        if not src_dir.exists():
            return []
        for ts_file in src_dir.rglob("*.ts*"):
            if "node_modules" in str(ts_file):
                continue
            try:
                content = ts_file.read_text()
            except (UnicodeDecodeError, PermissionError):
                continue
            for match in auth_re.finditer(content):
                patterns.append(ExtractedAuth(
                    pattern=f"auth.{match.group(1)}",
                    source_file=str(ts_file.relative_to(source_path)),
                    detail=match.group(2).strip() or None,
                ))
        return patterns

    def extract_routes(self, source_path: Path) -> list[ExtractedRoute]:
        """Parse App.tsx for <Route> elements."""
        routes: list[ExtractedRoute] = []
        app_file = source_path / "src" / "App.tsx"
        if not app_file.exists():
            return []
        content = app_file.read_text()
        route_re = re.compile(
            r'<Route\s+[^>]*path=["\']([^"\']+)["\'][^>]*element=\{<(\w+)'
        )
        for match in route_re.finditer(content):
            path = match.group(1)
            component = match.group(2)
            protected = "ProtectedRoute" in content[max(0, match.start()-200):match.start()]
            routes.append(ExtractedRoute(
                path=path, component=component, protected=protected
            ))
        return routes

    def extract_components(self, source_path: Path) -> list[ExtractedComponent]:
        """List .tsx component files with LOC and Supabase deps."""
        components: list[ExtractedComponent] = []
        comp_dir = source_path / "src" / "components"
        if not comp_dir.exists():
            return []
        for tsx_file in comp_dir.rglob("*.tsx"):
            if "node_modules" in str(tsx_file):
                continue
            try:
                content = tsx_file.read_text()
                loc = len(content.splitlines())
            except (UnicodeDecodeError, PermissionError):
                continue
            supabase_deps = list(set(
                m.group(1) for m in re.finditer(r'\.from\(["\'](\w+)["\']\)', content)
            ))
            components.append(ExtractedComponent(
                name=tsx_file.stem,
                path=str(tsx_file.relative_to(source_path)),
                loc=loc,
                supabase_deps=supabase_deps,
            ))
        return components

    def extract_hooks(self, source_path: Path) -> list[ExtractedHook]:
        """Categorize hooks as query/mutation/utility."""
        hooks: list[ExtractedHook] = []
        hooks_dir = source_path / "src" / "hooks"
        if not hooks_dir.exists():
            hooks_dir = source_path / "src"
        for ts_file in hooks_dir.rglob("use*.ts*"):
            if "node_modules" in str(ts_file):
                continue
            try:
                content = ts_file.read_text()
            except (UnicodeDecodeError, PermissionError):
                continue
            if "useQuery" in content or ".select(" in content:
                hook_type = "query"
            elif "useMutation" in content or ".insert(" in content or ".update(" in content:
                hook_type = "mutation"
            else:
                hook_type = "utility"
            table_deps = list(set(
                m.group(1) for m in re.finditer(r'\.from\(["\'](\w+)["\']\)', content)
            ))
            fn_deps = list(set(
                m.group(1) for m in re.finditer(r'\.functions\.invoke\(["\'](\w+)["\']\)', content)
            ))
            hooks.append(ExtractedHook(
                name=ts_file.stem,
                path=str(ts_file.relative_to(source_path)),
                hook_type=hook_type,
                table_deps=table_deps,
                fn_deps=fn_deps,
            ))
        return hooks

    def extract_rls_policies(self, source_path: Path) -> list[ExtractedRLSPolicy]:
        """Parse SQL migration files for CREATE POLICY statements."""
        policies: list[ExtractedRLSPolicy] = []
        migrations_dir = source_path / "supabase" / "migrations"
        if not migrations_dir.exists():
            return []
        policy_re = re.compile(
            r'CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+"?public"?\."?(\w+)"?\s+'
            r'(?:AS\s+\w+\s+)?FOR\s+(\w+)\s+.*?(?:USING|WITH CHECK)\s*\((.+?)\)\s*;',
            re.DOTALL | re.IGNORECASE,
        )
        for sql_file in migrations_dir.rglob("*.sql"):
            try:
                content = sql_file.read_text()
            except (UnicodeDecodeError, PermissionError):
                continue
            for match in policy_re.finditer(content):
                policies.append(ExtractedRLSPolicy(
                    policy_name=match.group(1),
                    table=match.group(2),
                    operation=match.group(3).upper(),
                    condition=match.group(4).strip(),
                ))
        return policies

    # ── Domain deduction (Gap 1 fix) ────────────────────────────────

    def _deduce_domains(
        self, tables: list[ExtractedTable], queries: list[ExtractedQuery],
    ) -> dict[str, list[str]]:
        """Group tables into logical domains using prefix analysis.

        Returns {domain_name: [table_names]}.
        """
        table_names = sorted(t.name for t in tables)
        if not table_names:
            return {}

        # Build prefix groups: product_images → "product"
        prefix_groups: dict[str, list[str]] = {}
        ungrouped: list[str] = []

        for name in table_names:
            parts = name.split("_")
            if len(parts) >= 2:
                # Try longest matching prefix first
                prefix = parts[0]
                prefix_groups.setdefault(prefix, []).append(name)
            else:
                ungrouped.append(name)

        # Merge singletons: if a prefix group has only one table and
        # the table name equals the prefix (e.g., "products" → ["products"]),
        # that's fine. But if a prefix has only a join-like table, check
        # if the second segment matches another prefix.
        domain_map: dict[str, list[str]] = {}

        for prefix, group_tables in prefix_groups.items():
            # Pluralize prefix for domain name
            domain_name = prefix if prefix.endswith("s") else prefix + "s"
            # If there's an exact match table (e.g., "products"), use it as canonical
            if any(t == prefix or t == domain_name for t in group_tables):
                domain_map[domain_name] = group_tables
            elif len(group_tables) >= 2:
                # Multiple tables share the prefix — it's a real domain
                domain_map[domain_name] = group_tables
            else:
                # Single table with prefix (e.g., "user_roles") — check if
                # the second segment matches a known prefix
                only_table = group_tables[0]
                second_parts = only_table.split("_")
                if len(second_parts) >= 2:
                    second_prefix = second_parts[1]
                    second_domain = second_prefix if second_prefix.endswith("s") else second_prefix + "s"
                    if second_domain in domain_map or second_prefix in prefix_groups:
                        # Assign to second prefix's domain
                        target = second_domain if second_domain in domain_map else (
                            second_prefix if second_prefix.endswith("s") else second_prefix + "s"
                        )
                        domain_map.setdefault(target, []).append(only_table)
                    else:
                        # Standalone — use as its own domain
                        domain_map[domain_name] = group_tables
                else:
                    domain_map[domain_name] = group_tables

        # Add ungrouped tables as individual domains
        for name in ungrouped:
            domain_name = name if name.endswith("s") else name + "s"
            domain_map.setdefault(domain_name, []).append(name)

        return domain_map

    # ── Orchestrator ────────────────────────────────────────────────

    def extract_manifest(self, source_path_str: str) -> LovableManifest:
        """Orchestrate full extraction."""
        source_path = Path(source_path_str)
        tables = self.extract_tables(source_path)
        queries = self.extract_queries(source_path)
        edge_functions = self.extract_edge_functions(source_path)
        rls_policies = self.extract_rls_policies(source_path)
        routes = self.extract_routes(source_path)
        components = self.extract_components(source_path)
        hooks = self.extract_hooks(source_path)
        auth_patterns = self.extract_auth_patterns(source_path)
        rpc_calls = self.extract_rpc_calls(source_path)
        storage_buckets = self.extract_storage_buckets(source_path)
        realtime_subs = self.extract_realtime_subscriptions(source_path)
        env_vars = self.extract_env_vars(source_path)

        domain_table_map = self._deduce_domains(tables, queries)
        domains = sorted(domain_table_map.keys())

        return LovableManifest(
            tables=tables,
            queries=queries,
            edge_functions=edge_functions,
            rls_policies=rls_policies,
            routes=routes,
            components=components,
            hooks=hooks,
            auth_patterns=auth_patterns,
            rpc_calls=rpc_calls,
            storage_buckets=storage_buckets,
            realtime_subscriptions=realtime_subs,
            env_vars=env_vars,
            domains=domains,
            domain_table_map=domain_table_map,
            summary=ManifestSummary(
                total_tables=len(tables),
                total_queries=len(queries),
                total_edge_functions=len(edge_functions),
                total_rls_policies=len(rls_policies),
                total_routes=len(routes),
                total_components=len(components),
                total_hooks=len(hooks),
                total_rpc_calls=len(rpc_calls),
                total_storage_buckets=len(storage_buckets),
                total_realtime_subscriptions=len(realtime_subs),
                total_env_vars=len(env_vars),
            ),
        )
