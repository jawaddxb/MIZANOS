export interface GitHubPat {
  id: string;
  label: string;
  github_username: string;
  github_avatar_url: string | null;
  github_user_id: number;
  created_by: string;
  scopes: string | null;
  last_used_at: string | null;
  is_active: boolean;
  token_status: "valid" | "expired" | "unknown";
  linked_products_count: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubPatVerifyResult {
  valid: boolean;
  github_username: string | null;
  github_avatar_url: string | null;
  github_user_id: number | null;
  scopes: string | null;
}
