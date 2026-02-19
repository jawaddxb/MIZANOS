import type { AppRole } from "@/lib/types";

export interface RoleConfig {
  label: string;
  description: string;
  color: string;
}

export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  business_owner: {
    label: "Business Owner",
    description: "Organizational top of the hierarchy with full access",
    color: "var(--role-admin)",
  },
  superadmin: {
    label: "Super Admin",
    description: "Full platform control including user management",
    color: "var(--role-admin)",
  },
  admin: {
    label: "Admin",
    description: "Full access to all features and settings",
    color: "var(--role-admin)",
  },
  pm: {
    label: "Project Manager",
    description: "Manages products, tasks, and team assignments",
    color: "var(--role-pm)",
  },
  engineer: {
    label: "Engineer",
    description: "Development tasks, code reviews, and deployments",
    color: "var(--role-engineer)",
  },
  bizdev: {
    label: "Business Development",
    description: "Client relations, specifications, and business operations",
    color: "var(--role-bizdev)",
  },
  marketing: {
    label: "Marketing",
    description: "Marketing campaigns, domains, and social media",
    color: "var(--role-marketing)",
  },
  product_manager: {
    label: "Product Manager",
    description: "Product intake, project overview, dashboard, and tasks",
    color: "var(--role-pm)",
  },
  operations: {
    label: "Operations",
    description: "Operational workflows, processes, and org-level coordination",
    color: "var(--role-bizdev)",
  },
} as const;

export const APP_ROLES: AppRole[] = [
  "business_owner",
  "superadmin",
  "admin",
  "pm",
  "engineer",
  "bizdev",
  "marketing",
  "product_manager",
  "operations",
];

/**
 * Default feature-key permissions per role.
 * Keys MUST match FeatureKey values used by useRoleVisibility / hasPermission().
 * "*" = wildcard (all permissions granted).
 * Used as fallback when the role_permissions DB table is empty.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  business_owner: ["*"],
  superadmin: ["*"],
  admin: ["*"],
  pm: [
    "intake_access", "dashboard_view", "project_overview", "sources_tab",
    "kanban_view", "kanban_edit",
    "specification_view", "specification_edit",
    "qa_manage", "audit_view", "environments_view",
    "documents_view", "documents_edit",
    "marketing_tab", "marketing_credentials",
    "management_notes", "partner_notes", "stakeholders_manage",
    "team_view", "team_manage",
    "credential_vault",
  ],
  engineer: [
    "dashboard_view", "project_overview", "sources_tab",
    "kanban_view", "kanban_edit",
    "specification_view",
    "qa_manage", "audit_view",
    "documents_view",
  ],
  bizdev: [
    "dashboard_view", "project_overview",
    "specification_view", "specification_edit",
    "documents_view", "documents_edit",
  ],
  marketing: [
    "dashboard_view", "project_overview",
    "marketing_tab", "marketing_credentials",
    "documents_view",
  ],
  product_manager: [
    "intake_access", "dashboard_view", "project_overview", "sources_tab",
    "kanban_view", "kanban_edit",
    "specification_view", "specification_edit",
    "qa_manage", "audit_view", "environments_view",
    "documents_view", "documents_edit",
    "marketing_tab", "marketing_credentials",
    "management_notes", "partner_notes", "stakeholders_manage",
    "team_view", "team_manage",
    "credential_vault",
  ],
  operations: [
    "dashboard_view", "project_overview",
    "team_view",
    "documents_view",
  ],
} as const;
