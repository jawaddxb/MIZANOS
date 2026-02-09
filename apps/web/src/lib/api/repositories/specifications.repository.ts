import type { Specification, SpecificationFeature, SpecificationSource } from "@/lib/types";
import { BaseRepository, type PaginatedResponse, type QueryParams } from "./base.repository";

export class SpecificationsRepository extends BaseRepository<Specification> {
  protected readonly basePath = "/specifications";

  async getByProduct(productId: string, params?: QueryParams): Promise<PaginatedResponse<Specification>> {
    return this.getAll({ ...params, product_id: productId });
  }

  async getFeatures(productId: string): Promise<SpecificationFeature[]> {
    const response = await this.client.get<SpecificationFeature[]>(
      `/products/${productId}/specification-features`,
    );
    return response.data;
  }

  async createFeature(data: Partial<SpecificationFeature>): Promise<SpecificationFeature> {
    const response = await this.client.post<SpecificationFeature>(
      `/products/${data.product_id}/specification-features`,
      data,
    );
    return response.data;
  }

  async updateFeature(featureId: string, data: Partial<SpecificationFeature>): Promise<SpecificationFeature> {
    const response = await this.client.patch<SpecificationFeature>(
      `/specification-features/${featureId}`,
      data,
    );
    return response.data;
  }

  async deleteFeature(featureId: string): Promise<void> {
    await this.client.delete(`/specification-features/${featureId}`);
  }

  async getReusableFeatures(excludeProductId?: string): Promise<SpecificationFeature[]> {
    const response = await this.client.get<SpecificationFeature[]>(
      "/specification-features/reusable",
      excludeProductId ? { params: { exclude_product_id: excludeProductId } } : undefined,
    );
    return response.data;
  }

  async getSources(productId: string): Promise<SpecificationSource[]> {
    const response = await this.client.get<SpecificationSource[]>(
      `/products/${productId}/specification-sources`,
    );
    return response.data;
  }

  async createSource(data: Partial<SpecificationSource>): Promise<SpecificationSource> {
    const response = await this.client.post<SpecificationSource>(
      `/products/${data.product_id}/specification-sources`,
      data,
    );
    return response.data;
  }

  async deleteSource(sourceId: string): Promise<void> {
    await this.client.delete(`/specification-sources/${sourceId}`);
  }
}

export const specificationsRepository = new SpecificationsRepository();
