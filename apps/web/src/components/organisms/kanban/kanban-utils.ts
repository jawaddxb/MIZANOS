import type {
  KanbanTask,
  Task,
} from "@/lib/types";
import type { TaskStatus, PillarType, TaskPriority } from "@/lib/types";

export const COLUMN_DEFINITIONS: { id: TaskStatus; title: string }[] = [
  { id: "backlog", title: "Backlog" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
  { id: "live", title: "Live" },
];

export function toKanbanTask(
  task: Task,
  assigneeMap?: Map<string, string>,
): KanbanTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    pillar: (task.pillar ?? "development") as PillarType,
    priority: (task.priority ?? "medium") as TaskPriority,
    status: (task.status ?? "backlog") as TaskStatus,
    assignee: task.assignee_id
      ? assigneeMap?.get(task.assignee_id)
      : undefined,
    assigneeId: task.assignee_id ?? undefined,
    dueDate: task.due_date ?? undefined,
    createdAt: task.created_at,
  };
}
