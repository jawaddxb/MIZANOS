import type { AxiosInstance } from "axios";
import type { GitHubPat, GitHubPatVerifyResult } from "@/lib/types/github-pat";
import { apiClient } from "../client";

export class GitHubPatsRepository {
  private readonly client: AxiosInstance;
  private readonly basePath = "/github-pats";

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async getAll(mineOnly = false): Promise<GitHubPat[]> {
    const response = await this.client.get<GitHubPat[]>(this.basePath, {
      params: { mine_only: mineOnly },
    });
    return response.data;
  }

  async verify(token: string): Promise<GitHubPatVerifyResult> {
    const response = await this.client.post<GitHubPatVerifyResult>(
      `${this.basePath}/verify`,
      { token },
    );
    return response.data;
  }

  async create(data: { label: string; token: string }): Promise<GitHubPat> {
    const response = await this.client.post<GitHubPat>(this.basePath, data);
    return response.data;
  }

  async update(
    id: string,
    data: { label?: string; is_active?: boolean },
  ): Promise<GitHubPat> {
    const response = await this.client.patch<GitHubPat>(
      `${this.basePath}/${id}`,
      data,
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}`);
  }
}

export const githubPatsRepository = new GitHubPatsRepository();
