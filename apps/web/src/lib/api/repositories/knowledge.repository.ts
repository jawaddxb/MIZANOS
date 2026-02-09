import type { KnowledgeEntry } from "@/lib/types";
import { BaseRepository, type PaginatedResponse, type QueryParams } from "./base.repository";

export class KnowledgeRepository extends BaseRepository<KnowledgeEntry> {
  protected readonly basePath = "/knowledge";

  async getByCategory(category: string, params?: QueryParams): Promise<PaginatedResponse<KnowledgeEntry>> {
    return this.getAll({ ...params, category });
  }

  async getByProduct(productId: string, params?: QueryParams): Promise<PaginatedResponse<KnowledgeEntry>> {
    return this.getAll({ ...params, product_id: productId });
  }

  async getByType(entryType: string, params?: QueryParams): Promise<PaginatedResponse<KnowledgeEntry>> {
    return this.getAll({ ...params, entry_type: entryType });
  }
}

export const knowledgeRepository = new KnowledgeRepository();
