import type { TaskTemplate } from "@/lib/types";
import { BaseRepository } from "./base.repository";

export class TaskTemplatesRepository extends BaseRepository<
  TaskTemplate,
  Partial<TaskTemplate>,
  Partial<TaskTemplate>
> {
  protected readonly basePath = "/task-templates";

  async reorder(sourceType: string, orderedIds: string[]): Promise<void> {
    await this.client.put(`${this.basePath}/reorder`, {
      source_type: sourceType,
      ordered_ids: orderedIds,
    });
  }
}

export const taskTemplatesRepository = new TaskTemplatesRepository();
