export type AppRole = "business_owner" | "superadmin" | "admin" | "pm" | "engineer" | "bizdev" | "marketing" | "product_manager" | "operations";

export type EnvironmentType = "development" | "staging" | "production";

export type NotificationType =
  | "task_assigned"
  | "product_status_changed"
  | "qa_check_failed"
  | "specification_ready"
  | "stage_changed"
  | "repo_scan_completed"
  | "product_member_assigned";

export type ProjectSourceType =
  | "lovable_port"
  | "replit_port"
  | "github_unscaffolded"
  | "greenfield"
  | "external_handoff"
  | "in_progress"
  | "in_progress_standards"
  | "in_progress_legacy";

export type PillarType = "business" | "marketing" | "development" | "product";

export type TaskStatus = "backlog" | "in_progress" | "review" | "done" | "live";

export type TaskPriority = "low" | "medium" | "high";

export type ProductStatus = "active" | "on_hold" | "completed" | "archived";

export type QACheckStatus = "pass" | "fail" | "pending" | "in_progress";

export type FeaturePriority = "low" | "medium" | "high" | "critical";

export type FeatureStatus = "pending" | "in_progress" | "completed" | "deferred";
