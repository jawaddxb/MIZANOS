import type { Job } from "@/lib/types/job";
import { BaseRepository } from "./base.repository";

export class JobsRepository extends BaseRepository<Job> {
  protected readonly basePath = "/jobs";

  async getByProduct(productId: string, status?: string): Promise<Job[]> {
    const params: Record<string, string> = { product_id: productId };
    if (status) params.status = status;
    const result = await this.getAll(params);
    return Array.isArray(result) ? result : result.data ?? [];
  }
}

export const jobsRepository = new JobsRepository();
