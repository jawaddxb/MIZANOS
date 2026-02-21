import type { ProfileSummary } from "./product";

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  author: ProfileSummary | null;
  replies: TaskComment[];
  created_at: string;
  updated_at: string;
}
