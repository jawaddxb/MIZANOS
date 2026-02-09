import type { JsonValue } from "./common";

export interface Audit {
  id: string;
  product_id: string;
  overall_score: number;
  categories: JsonValue;
  issues: JsonValue;
  run_at: string;
  created_by: string | null;
  created_at: string;
}

export interface RepoScanHistory {
  id: string;
  product_id: string;
  repository_url: string;
  branch: string;
  latest_commit_sha: string;
  previous_commit_sha: string | null;
  scan_status: string;
  files_changed: number;
  lines_added: number;
  lines_removed: number;
  files_added: JsonValue;
  files_modified: JsonValue;
  files_removed: JsonValue;
  components_discovered: JsonValue;
  diff_summary: string | null;
  error_message: string | null;
  created_at: string;
}

export interface RepositoryAnalysis {
  id: string;
  product_id: string;
  repository_url: string;
  branch: string | null;
  overall_score: number | null;
  file_count: number | null;
  tech_stack: JsonValue | null;
  structure_map: JsonValue | null;
  code_critique: JsonValue | null;
  functional_inventory: JsonValue | null;
  gap_analysis: JsonValue | null;
  standards_compliance: JsonValue | null;
  created_at: string;
}
