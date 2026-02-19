import type { TaskStatus } from "@/lib/types";

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  backlog: {
    label: "Backlog",
    color: "var(--status-backlog)",
    bgColor: "var(--status-backlog-bg)",
  },
  in_progress: {
    label: "In Progress",
    color: "var(--status-in-progress)",
    bgColor: "var(--status-in-progress-bg)",
  },
  review: {
    label: "Review",
    color: "var(--status-review)",
    bgColor: "var(--status-review-bg)",
  },
  done: {
    label: "Done",
    color: "var(--status-done)",
    bgColor: "var(--status-done-bg)",
  },
  live: {
    label: "Live",
    color: "var(--status-live)",
    bgColor: "var(--status-live-bg)",
  },
} as const;

export const PRODUCT_STATUS_CONFIG: Record<string, StatusConfig> = {
  active: {
    label: "Active",
    color: "var(--status-active)",
    bgColor: "var(--status-active-bg)",
  },
  on_hold: {
    label: "On Hold",
    color: "var(--status-on-hold)",
    bgColor: "var(--status-on-hold-bg)",
  },
  completed: {
    label: "Completed",
    color: "var(--status-completed)",
    bgColor: "var(--status-completed-bg)",
  },
  archived: {
    label: "Archived",
    color: "var(--status-archived)",
    bgColor: "var(--status-archived-bg)",
  },
} as const;

export const QA_STATUS_CONFIG: Record<string, StatusConfig> = {
  pass: {
    label: "Pass",
    color: "var(--status-pass)",
    bgColor: "var(--status-pass-bg)",
  },
  fail: {
    label: "Fail",
    color: "var(--status-fail)",
    bgColor: "var(--status-fail-bg)",
  },
  pending: {
    label: "Pending",
    color: "var(--status-pending)",
    bgColor: "var(--status-pending-bg)",
  },
  in_progress: {
    label: "In Progress",
    color: "var(--status-in-progress)",
    bgColor: "var(--status-in-progress-bg)",
  },
} as const;

export const ENVIRONMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  active: {
    label: "Active",
    color: "var(--status-active)",
    bgColor: "var(--status-active-bg)",
  },
  inactive: {
    label: "Inactive",
    color: "var(--status-inactive)",
    bgColor: "var(--status-inactive-bg)",
  },
  deploying: {
    label: "Deploying",
    color: "var(--status-deploying)",
    bgColor: "var(--status-deploying-bg)",
  },
} as const;

export const PRIORITY_CONFIG: Record<string, StatusConfig> = {
  low: {
    label: "Low",
    color: "var(--priority-low)",
    bgColor: "var(--priority-low-bg)",
  },
  medium: {
    label: "Medium",
    color: "var(--priority-medium)",
    bgColor: "var(--priority-medium-bg)",
  },
  high: {
    label: "High",
    color: "var(--priority-high)",
    bgColor: "var(--priority-high-bg)",
  },
  critical: {
    label: "Critical",
    color: "var(--priority-critical)",
    bgColor: "var(--priority-critical-bg)",
  },
} as const;
