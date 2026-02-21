import type { AppRole } from "@/lib/types";

export interface RoleConfig {
  label: string;
  description: string;
  color: string;
}

export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  superadmin: {
    label: "Super Admin",
    description: "Highest authority with full platform control",
    color: "var(--role-admin)",
  },
  business_owner: {
    label: "Business Owner",
    description: "Organizational management with full access",
    color: "var(--role-admin)",
  },
  admin: {
    label: "Admin",
    description: "Full access to all features and settings",
    color: "var(--role-admin)",
  },
  executive: {
    label: "Executive",
    description: "Read-only access to all platform data and reports",
    color: "var(--role-admin)",
  },
  project_manager: {
    label: "Project Manager",
    description: "Manages products, tasks, and team assignments",
    color: "var(--role-pm)",
  },
  engineer: {
    label: "Engineer",
    description: "Development tasks, code reviews, and deployments",
    color: "var(--role-engineer)",
  },
  business_development: {
    label: "Business Development",
    description: "Client relations, specifications, and business operations",
    color: "var(--role-bizdev)",
  },
  marketing: {
    label: "Marketing",
    description: "Marketing campaigns, domains, and social media",
    color: "var(--role-marketing)",
  },
  operations: {
    label: "Operations",
    description: "Operational workflows, processes, and org-level coordination",
    color: "var(--role-bizdev)",
  },
} as const;

/**
 * Mirrors backend INVITE_MATRIX from invite_service.py.
 * Defines which roles each role is allowed to invite.
 */
export const INVITE_MATRIX: Record<AppRole, AppRole[]> = {
  superadmin: ["superadmin", "business_owner", "admin", "executive", "project_manager", "engineer", "business_development", "marketing", "operations"],
  business_owner: ["admin", "executive", "project_manager", "engineer", "business_development", "marketing", "operations"],
  admin: ["executive", "project_manager", "engineer", "business_development", "marketing", "operations"],
  project_manager: ["engineer", "business_development", "marketing", "operations"],
  executive: [],
  engineer: [],
  business_development: [],
  marketing: [],
  operations: [],
};

/** Returns the set of roles the user can invite, considering all their roles (primary + secondary). */
export function getInvitableRoles(userRoles: string[]): Set<AppRole> {
  const allowed = new Set<AppRole>();
  for (const role of userRoles) {
    const invitable = INVITE_MATRIX[role as AppRole];
    if (invitable) invitable.forEach((r) => allowed.add(r));
  }
  return allowed;
}

export const APP_ROLES: AppRole[] = [
  "superadmin",
  "business_owner",
  "admin",
  "executive",
  "project_manager",
  "engineer",
  "business_development",
  "marketing",
  "operations",
];

/**
 * Default feature-key permissions per role.
 * Keys MUST match FeatureKey values used by useRoleVisibility / hasPermission().
 * "*" = wildcard (all permissions granted).
 * Used as fallback when the role_permissions DB table is empty.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  superadmin: ["*"],
  business_owner: ["*"],
  admin: ["*"],
  executive: [
    "intake_access", "dashboard_view", "project_overview", "sources_tab",
    "kanban_view", "specification_view", "audit_view", "environments_view",
    "documents_view", "marketing_tab", "marketing_credentials",
    "management_notes", "partner_notes", "team_view",
  ],
  project_manager: [
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
  business_development: [
    "dashboard_view", "project_overview",
    "specification_view", "specification_edit",
    "documents_view", "documents_edit",
  ],
  marketing: [
    "dashboard_view", "project_overview",
    "marketing_tab", "marketing_credentials",
    "documents_view",
  ],
  operations: [
    "dashboard_view", "project_overview",
    "team_view",
    "documents_view",
  ],
} as const;
