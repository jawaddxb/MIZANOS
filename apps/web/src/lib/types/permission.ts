export type FeatureKey =
  | "intake_access"
  | "dashboard_view"
  | "project_overview"
  | "sources_tab"
  | "kanban_view"
  | "kanban_edit"
  | "specification_view"
  | "specification_edit"
  | "qa_manage"
  | "audit_view"
  | "environments_view"
  | "documents_view"
  | "documents_edit"
  | "marketing_tab"
  | "marketing_credentials"
  | "management_notes"
  | "partner_notes"
  | "stakeholders_manage"
  | "team_view"
  | "team_manage"
  | "settings_access"
  | "role_management"
  | "workflow_rules"
  | "credential_vault";

export interface UserOverride {
  id: string;
  user_id: string;
  feature_key: string;
  override_type: "grant" | "deny";
  reason: string | null;
  expires_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface PermissionAuditLog {
  id: string;
  action_type: string;
  target_role: string | null;
  target_user_id: string | null;
  feature_key: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  changed_by: string | null;
  created_at: string;
}

export interface StandardsRepository {
  id: string;
  name: string;
  url: string;
  description: string | null;
  markdown_content: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
  availability: string | null;
  skills: string[] | null;
  max_projects: number | null;
  office_location: string | null;
  invited_at: string | null;
  last_login: string | null;
  must_reset_password: boolean | null;
  role: string | null;
}

export interface ProfileProject {
  id: string;
  productId: string;
  productName: string;
  role: string | null;
}

export interface TaskCount {
  profileId: string;
  total: number;
  backlog: number;
  inProgress: number;
  inReview: number;
  done: number;
}
