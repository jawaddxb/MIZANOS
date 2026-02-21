import type { TaskComment } from "@/lib/types";
import { apiClient } from "../client";

export class TaskCommentsRepository {
  async getByTask(taskId: string): Promise<TaskComment[]> {
    const response = await apiClient.get<TaskComment[]>(
      `/tasks/${taskId}/comments`,
    );
    return response.data;
  }

  async create(
    taskId: string,
    content: string,
    parentId?: string,
  ): Promise<TaskComment> {
    const response = await apiClient.post<TaskComment>(
      `/tasks/${taskId}/comments`,
      { content, parent_id: parentId ?? null },
    );
    return response.data;
  }

  async update(
    taskId: string,
    commentId: string,
    content: string,
  ): Promise<TaskComment> {
    const response = await apiClient.patch<TaskComment>(
      `/tasks/${taskId}/comments/${commentId}`,
      { content },
    );
    return response.data;
  }

  async delete(taskId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
  }
}

export const taskCommentsRepository = new TaskCommentsRepository();
