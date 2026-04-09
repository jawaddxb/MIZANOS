import type { ApiKey, ApiKeyCreateResponse } from "@/lib/types";
import { apiClient } from "../client";

class ApiKeysRepository {
  private basePath = "/api-keys";

  async getAll(): Promise<ApiKey[]> {
    const response = await apiClient.get<ApiKey[]>(this.basePath);
    return response.data;
  }

  async create(data: { label: string }): Promise<ApiKeyCreateResponse> {
    const response = await apiClient.post<ApiKeyCreateResponse>(this.basePath, data);
    return response.data;
  }

  async reveal(id: string): Promise<string> {
    const response = await apiClient.get<{ raw_key: string }>(`${this.basePath}/${id}/reveal`);
    return response.data.raw_key;
  }

  async update(id: string, data: { label?: string; is_active?: boolean }): Promise<ApiKey> {
    const response = await apiClient.patch<ApiKey>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}

export const apiKeysRepository = new ApiKeysRepository();
