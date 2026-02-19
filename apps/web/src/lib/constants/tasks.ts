import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export interface TaskStatusConfig {
  icon: LucideIcon;
  color: string;
  label: string;
}

export const TASK_STATUS_DISPLAY: Record<string, TaskStatusConfig> = {
  backlog: { icon: Circle, color: "text-muted-foreground", label: "Backlog" },
  in_progress: { icon: Clock, color: "text-yellow-600 dark:text-yellow-400", label: "In Progress" },
  review: { icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400", label: "Review" },
  done: { icon: CheckCircle2, color: "text-green-600 dark:text-green-400", label: "Done" },
  live: { icon: Rocket, color: "text-blue-600 dark:text-blue-400", label: "Live" },
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export const TASK_STATUSES = ["backlog", "in_progress", "review", "done", "live"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export const TASK_PILLARS = ["development", "product", "business", "marketing"] as const;
