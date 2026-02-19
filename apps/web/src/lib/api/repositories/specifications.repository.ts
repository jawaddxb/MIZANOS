import type { Specification, SpecificationFeature, SpecificationSource } from "@/lib/types";
import { BaseRepository, type PaginatedResponse, type QueryParams } from "./base.repository";

export class SpecificationsRepository extends BaseRepository<Specification> {
  protected readonly basePath = "/specifications";

  async getByProduct(productId: string, params?: QueryParams): Promise<Specification[]> {
    const response = await this.client.get<Specification[]>(this.basePath, {
      params: { ...params, product_id: productId },
    });
    return response.data;
  }

  async createSpecification(data: { product_id: string; content: Record<string, unknown> }): Promise<Specification> {
    return this.create(data as Partial<Specification>);
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
      `/specifications/features/${featureId}`,
      data,
    );
    return response.data;
  }

  async deleteFeature(featureId: string): Promise<void> {
    await this.client.delete(`/specifications/features/${featureId}`);
  }

  async getReusableFeatures(excludeProductId?: string): Promise<SpecificationFeature[]> {
    const response = await this.client.get<SpecificationFeature[]>(
      "/specifications/features/library",
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

  async regenerateSpec(productId: string): Promise<Record<string, unknown>> {
    const response = await this.client.post(`/specifications/generate`, null, {
      params: { product_id: productId },
      timeout: 120_000,
    });
    return response.data;
  }

  async queueFeature(featureId: string): Promise<SpecificationFeature> {
    const response = await this.client.post<SpecificationFeature>(
      `/specifications/features/${featureId}/queue`,
    );
    return response.data;
  }

  async unqueueFeature(featureId: string): Promise<SpecificationFeature> {
    const response = await this.client.post<SpecificationFeature>(
      `/specifications/features/${featureId}/unqueue`,
    );
    return response.data;
  }
}

export const specificationsRepository = new SpecificationsRepository();
