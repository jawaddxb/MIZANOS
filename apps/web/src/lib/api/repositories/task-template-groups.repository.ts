import type { TaskTemplateGroup, TaskTemplateGroupDetail } from "@/lib/types";
import { BaseRepository } from "./base.repository";

export class TaskTemplateGroupsRepository extends BaseRepository<
  TaskTemplateGroup,
  Partial<TaskTemplateGroup>,
  Partial<TaskTemplateGroup>
> {
  protected readonly basePath = "/task-template-groups";

  async getDetail(id: string): Promise<TaskTemplateGroupDetail> {
    const response = await this.client.get<TaskTemplateGroupDetail>(
      `${this.basePath}/${id}`,
    );
    return response.data;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await this.client.put(`${this.basePath}/reorder`, {
      ordered_ids: orderedIds,
    });
  }

  async apply(groupId: string, productId: string): Promise<void> {
    await this.client.post(
      `${this.basePath}/${groupId}/apply`,
      null,
      { params: { product_id: productId } },
    );
  }
}

export const taskTemplateGroupsRepository = new TaskTemplateGroupsRepository();
