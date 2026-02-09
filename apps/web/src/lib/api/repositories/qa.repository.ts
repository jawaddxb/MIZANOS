import type { QACheck } from "@/lib/types";
import { BaseRepository, type PaginatedResponse, type QueryParams } from "./base.repository";

export class QARepository extends BaseRepository<QACheck> {
  protected readonly basePath = "/qa";

  async getByProduct(productId: string, params?: QueryParams): Promise<PaginatedResponse<QACheck>> {
    return this.getAll({ ...params, product_id: productId });
  }

  async getByCategory(category: string, params?: QueryParams): Promise<PaginatedResponse<QACheck>> {
    return this.getAll({ ...params, category });
  }

  async toggleCheck(checkId: string, status: string): Promise<QACheck> {
    const response = await this.client.patch<QACheck>(
      `${this.basePath}/${checkId}`,
      { status },
    );
    return response.data;
  }

  async updateNotes(checkId: string, notes: string): Promise<QACheck> {
    const response = await this.client.patch<QACheck>(
      `${this.basePath}/${checkId}`,
      { notes },
    );
    return response.data;
  }
}

export const qaRepository = new QARepository();
