import type { SystemDocument, GenerateDocsResponse } from "@/lib/types/system-document";
import { BaseRepository, type PaginatedResponse } from "./base.repository";

export class SystemDocumentsRepository extends BaseRepository<SystemDocument> {
  protected readonly basePath = "/system-documents";

  async getByProduct(productId: string): Promise<PaginatedResponse<SystemDocument>> {
    return this.getAll({ product_id: productId });
  }

  async getVersions(docId: string): Promise<SystemDocument[]> {
    const response = await this.client.get<SystemDocument[]>(
      `${this.basePath}/${docId}/versions`
    );
    return response.data;
  }

  async generate(productId: string, sourcePath?: string): Promise<GenerateDocsResponse> {
    const response = await this.client.post<GenerateDocsResponse>(
      `${this.basePath}/${productId}/generate`,
      sourcePath ? { source_path: sourcePath } : {},
      { timeout: 180_000 }
    );
    return response.data;
  }

  async regenerate(productId: string): Promise<GenerateDocsResponse> {
    const response = await this.client.post<GenerateDocsResponse>(
      `${this.basePath}/${productId}/regenerate`,
      {},
      { timeout: 180_000 }
    );
    return response.data;
  }
}

export const systemDocumentsRepository = new SystemDocumentsRepository();
