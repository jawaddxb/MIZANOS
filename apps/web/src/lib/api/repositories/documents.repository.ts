import type {
  ProductDocument,
  DocumentFolder,
  DocumentVersion,
  DocumentAccessLink,
} from "@/lib/types";
import { BaseRepository, type PaginatedResponse, type QueryParams } from "./base.repository";

export class DocumentsRepository extends BaseRepository<ProductDocument> {
  protected readonly basePath = "/documents";

  async getByProduct(productId: string, params?: QueryParams): Promise<PaginatedResponse<ProductDocument>> {
    return this.getAll({ ...params, product_id: productId });
  }

  async getFolders(productId: string): Promise<DocumentFolder[]> {
    const response = await this.client.get<DocumentFolder[]>(
      `${this.basePath}/folders`,
      { params: { product_id: productId } },
    );
    return response.data;
  }

  async createFolder(data: { product_id: string; name: string; parent_id?: string }): Promise<DocumentFolder> {
    const response = await this.client.post<DocumentFolder>(
      `${this.basePath}/folders`,
      data,
    );
    return response.data;
  }

  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const response = await this.client.get<DocumentVersion[]>(
      `${this.basePath}/${documentId}/versions`,
    );
    return response.data;
  }

  async getAccessLinks(productId: string): Promise<DocumentAccessLink[]> {
    const response = await this.client.get<DocumentAccessLink[]>(
      `${this.basePath}/access-links`,
      { params: { product_id: productId } },
    );
    return response.data;
  }

  async createAccessLink(data: {
    product_id: string;
    name: string;
    expires_at?: string;
  }): Promise<DocumentAccessLink> {
    const response = await this.client.post<DocumentAccessLink>(
      `${this.basePath}/access-links`,
      data,
    );
    return response.data;
  }

  async revokeAccessLink(productId: string, linkId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/access-links/${linkId}`);
  }

  async getSharedDocuments(token: string): Promise<{
    product: { id: string; name: string };
    link_name: string;
    documents: Array<{
      id: string; file_name: string; file_size: number; file_type: string;
      category: string; description: string | null; created_at: string; download_url: string | null;
    }>;
  }> {
    const response = await this.client.get(`/documents/shared/${token}`);
    return response.data;
  }

  async upload(productId: string, formData: FormData): Promise<ProductDocument> {
    const response = await this.client.post<ProductDocument>(
      `${this.basePath}/upload/${productId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  }
}

export const documentsRepository = new DocumentsRepository();
