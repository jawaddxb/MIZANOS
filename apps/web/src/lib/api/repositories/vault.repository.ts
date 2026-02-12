import type { CompanyCredential } from "@/lib/types";
import { BaseRepository, type PaginatedResponse, type QueryParams } from "./base.repository";

export class VaultRepository extends BaseRepository<CompanyCredential> {
  protected readonly basePath = "/vault";

  async getByCategory(category: string, params?: QueryParams): Promise<PaginatedResponse<CompanyCredential>> {
    return this.getAll({ ...params, category });
  }

  async getByProduct(productId: string, params?: QueryParams): Promise<PaginatedResponse<CompanyCredential>> {
    return this.getAll({ ...params, linked_product_id: productId });
  }

  async getByTags(tags: string[], params?: QueryParams): Promise<PaginatedResponse<CompanyCredential>> {
    return this.getAll({ ...params, tags: tags.join(",") });
  }

  async decrypt(id: string): Promise<Record<string, string>> {
    const response = await this.client.get<Record<string, string>>(`${this.basePath}/${id}/decrypt`);
    return response.data;
  }
}

export const vaultRepository = new VaultRepository();
