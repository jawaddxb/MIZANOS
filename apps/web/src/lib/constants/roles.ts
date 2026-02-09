import type { AppRole } from "@/lib/types";

export interface RoleConfig {
  label: string;
  description: string;
  color: string;
}

export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
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
} as const;

export const APP_ROLES: AppRole[] = [
  "admin",
  "pm",
  "engineer",
  "bizdev",
  "marketing",
];

export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  admin: ["*"],
  pm: [
    "products.view",
    "products.edit",
    "tasks.view",
    "tasks.edit",
    "team.view",
    "specifications.view",
    "specifications.edit",
    "qa.view",
    "qa.edit",
    "documents.view",
    "documents.edit",
    "notifications.view",
    "audit.view",
    "knowledge.view",
    "knowledge.edit",
  ],
  engineer: [
    "products.view",
    "tasks.view",
    "tasks.edit",
    "specifications.view",
    "qa.view",
    "qa.edit",
    "documents.view",
    "audit.view",
    "knowledge.view",
  ],
  bizdev: [
    "products.view",
    "specifications.view",
    "specifications.edit",
    "documents.view",
    "documents.edit",
    "knowledge.view",
  ],
  marketing: [
    "products.view",
    "marketing.view",
    "marketing.edit",
    "documents.view",
    "knowledge.view",
  ],
} as const;
