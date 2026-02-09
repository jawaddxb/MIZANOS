import type { PillarType, ProjectSourceType, TaskPriority, TaskStatus } from "./enums";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  product_id: string;
  assignee_id: string | null;
  status: string | null;
  priority: string | null;
  pillar: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  pillar: string;
  priority: string | null;
  default_status: string | null;
  source_type: ProjectSourceType;
  order_index: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  pillar: PillarType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee?: string;
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: KanbanTask[];
}

export const PILLAR_ORDER: PillarType[] = ["development", "product", "business", "marketing"];
