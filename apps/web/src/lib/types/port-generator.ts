export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
}

export interface ExtractedTable {
  name: string;
  columns: ColumnDef[];
}

export interface ExtractedQuery {
  source_file: string;
  table: string;
  operation: string;
  detail: string | null;
  filters: string[];
}

export interface ExtractedEdgeFunction {
  name: string;
  callers: string[];
  target_service: string | null;
  target_endpoint: string | null;
}

export interface ExtractedRPC {
  function_name: string;
  source_file: string;
  args: string | null;
}

export interface ExtractedStorageBucket {
  bucket_name: string;
  source_file: string;
  operations: string[];
}

export interface ExtractedRealtimeSubscription {
  channel_name: string;
  source_file: string;
  table: string | null;
  event: string | null;
}

export interface ExtractedRLSPolicy {
  table: string;
  policy_name: string;
  operation: string;
  condition: string;
}

export interface ExtractedRoute {
  path: string;
  component: string;
  protected: boolean;
  target_page: string | null;
}

export interface ExtractedComponent {
  name: string;
  path: string;
  loc: number;
  supabase_deps: string[];
  target_location: string | null;
}

export interface ExtractedHook {
  name: string;
  path: string;
  hook_type: string;
  table_deps: string[];
  fn_deps: string[];
  target_path: string | null;
}

export interface ExtractedAuth {
  pattern: string;
  source_file: string;
  detail: string | null;
}

export interface ExtractedEnvVar {
  name: string;
  source_file: string;
  prefix: string;
}

export interface ManifestSummary {
  total_tables: number;
  total_queries: number;
  total_edge_functions: number;
  total_rls_policies: number;
  total_routes: number;
  total_components: number;
  total_hooks: number;
  total_rpc_calls: number;
  total_storage_buckets: number;
  total_realtime_subscriptions: number;
  total_env_vars: number;
}

export interface LovableManifest {
  tables: ExtractedTable[];
  queries: ExtractedQuery[];
  edge_functions: ExtractedEdgeFunction[];
  rls_policies: ExtractedRLSPolicy[];
  routes: ExtractedRoute[];
  components: ExtractedComponent[];
  hooks: ExtractedHook[];
  auth_patterns: ExtractedAuth[];
  rpc_calls: ExtractedRPC[];
  storage_buckets: ExtractedStorageBucket[];
  realtime_subscriptions: ExtractedRealtimeSubscription[];
  env_vars: ExtractedEnvVar[];
  domains: string[];
  domain_table_map: Record<string, string[]>;
  summary: ManifestSummary;
}

export interface GenerateTasksResponse {
  tasks_created: number;
  domains: string[];
  summary: Record<string, unknown>;
}
