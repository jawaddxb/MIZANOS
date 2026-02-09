import type { Task, TaskTemplate } from "@/lib/types";
import { BaseRepository, type PaginatedResponse, type QueryParams } from "./base.repository";

export class TasksRepository extends BaseRepository<Task> {
  protected readonly basePath = "/tasks";

  async getByProduct(productId: string, params?: QueryParams): Promise<PaginatedResponse<Task>> {
    return this.getAll({ ...params, product_id: productId });
  }

  async getByAssignee(assigneeId: string, params?: QueryParams): Promise<PaginatedResponse<Task>> {
    return this.getAll({ ...params, assignee_id: assigneeId });
  }

  async getByStatus(status: string, params?: QueryParams): Promise<PaginatedResponse<Task>> {
    return this.getAll({ ...params, status });
  }

  async getByPillar(pillar: string, params?: QueryParams): Promise<PaginatedResponse<Task>> {
    return this.getAll({ ...params, pillar });
  }

  async reorder(taskId: string, newIndex: number, status?: string): Promise<void> {
    await this.client.patch(`${this.basePath}/${taskId}/reorder`, {
      order_index: newIndex,
      status,
    });
  }

  async getTemplates(sourceType?: string): Promise<TaskTemplate[]> {
    const response = await this.client.get<TaskTemplate[]>("/task-templates", {
      params: sourceType ? { source_type: sourceType } : undefined,
    });
    return response.data;
  }
}

export const tasksRepository = new TasksRepository();
