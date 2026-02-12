"""Pydantic models for Lovable project extraction output."""

from apps.api.schemas.base import BaseSchema


class ColumnDef(BaseSchema):
    """Single column definition from a Supabase table."""

    name: str
    type: str
    nullable: bool = True


class ExtractedTable(BaseSchema):
    """Table extracted from Supabase types.ts."""

    name: str
    columns: list[ColumnDef] = []


class ExtractedQuery(BaseSchema):
    """Supabase query call found in source code."""

    source_file: str
    table: str
    operation: str
    detail: str | None = None
    filters: list[str] = []


class ExtractedEdgeFunction(BaseSchema):
    """Supabase Edge Function definition or invocation."""

    name: str
    callers: list[str] = []
    target_service: str | None = None
    target_endpoint: str | None = None


class ExtractedRPC(BaseSchema):
    """Supabase .rpc() call found in source code."""

    function_name: str
    source_file: str
    args: str | None = None


class ExtractedStorageBucket(BaseSchema):
    """Supabase .storage.from() usage found in source code."""

    bucket_name: str
    source_file: str
    operations: list[str] = []


class ExtractedRealtimeSubscription(BaseSchema):
    """Supabase .channel().on() usage found in source code."""

    channel_name: str
    source_file: str
    table: str | None = None
    event: str | None = None


class ExtractedRLSPolicy(BaseSchema):
    """Row Level Security policy parsed from migration SQL."""

    table: str
    policy_name: str
    operation: str
    condition: str


class ExtractedRoute(BaseSchema):
    """Route definition from App.tsx."""

    path: str
    component: str
    protected: bool = False
    target_page: str | None = None


class ExtractedComponent(BaseSchema):
    """React component file with metadata."""

    name: str
    path: str
    loc: int = 0
    supabase_deps: list[str] = []
    target_location: str | None = None


class ExtractedHook(BaseSchema):
    """React hook with categorization."""

    name: str
    path: str
    hook_type: str
    table_deps: list[str] = []
    fn_deps: list[str] = []
    target_path: str | None = None


class ExtractedAuth(BaseSchema):
    """Supabase auth pattern usage."""

    pattern: str
    source_file: str
    detail: str | None = None


class ExtractedEnvVar(BaseSchema):
    """Environment variable reference found in source code."""

    name: str
    source_file: str
    prefix: str  # "VITE_", "import.meta.env.", "process.env."


class ManifestSummary(BaseSchema):
    """Aggregate counts for the manifest."""

    total_tables: int = 0
    total_queries: int = 0
    total_edge_functions: int = 0
    total_rls_policies: int = 0
    total_routes: int = 0
    total_components: int = 0
    total_hooks: int = 0
    total_rpc_calls: int = 0
    total_storage_buckets: int = 0
    total_realtime_subscriptions: int = 0
    total_env_vars: int = 0


class LovableManifest(BaseSchema):
    """Complete extraction result from a Lovable project."""

    tables: list[ExtractedTable] = []
    queries: list[ExtractedQuery] = []
    edge_functions: list[ExtractedEdgeFunction] = []
    rls_policies: list[ExtractedRLSPolicy] = []
    routes: list[ExtractedRoute] = []
    components: list[ExtractedComponent] = []
    hooks: list[ExtractedHook] = []
    auth_patterns: list[ExtractedAuth] = []
    rpc_calls: list[ExtractedRPC] = []
    storage_buckets: list[ExtractedStorageBucket] = []
    realtime_subscriptions: list[ExtractedRealtimeSubscription] = []
    env_vars: list[ExtractedEnvVar] = []
    domains: list[str] = []
    domain_table_map: dict[str, list[str]] = {}
    summary: ManifestSummary = ManifestSummary()
