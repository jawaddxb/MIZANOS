import type { TaskTemplate } from "@/lib/types";
import { BaseRepository } from "./base.repository";

export class TaskTemplatesRepository extends BaseRepository<
  TaskTemplate,
  Partial<TaskTemplate>,
  Partial<TaskTemplate>
> {
  protected readonly basePath = "/task-templates";
}

export const taskTemplatesRepository = new TaskTemplatesRepository();
