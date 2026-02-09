import type { AxiosInstance } from "axios";
import { apiClient } from "../client";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
}

export abstract class BaseRepository<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  protected readonly client: AxiosInstance;
  protected abstract readonly basePath: string;

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async getAll(params?: QueryParams): Promise<PaginatedResponse<T>> {
    const response = await this.client.get<PaginatedResponse<T>>(this.basePath, { params });
    return response.data;
  }

  async getById(id: string): Promise<T> {
    const response = await this.client.get<T>(`${this.basePath}/${id}`);
    return response.data;
  }

  async create(data: TCreate): Promise<T> {
    const response = await this.client.post<T>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: TUpdate): Promise<T> {
    const response = await this.client.patch<T>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}`);
  }
}
