import type { AxiosInstance } from "axios";
import type { RepoScanHistory, RepositoryAnalysis, GitHubInfo } from "@/lib/types";
import { apiClient } from "../client";

interface GitHubConnection {
  id: string;
  user_id: string;
  github_username: string;
  github_user_id: number;
  github_avatar_url: string | null;
  token_scope: string | null;
  connected_at: string;
  updated_at: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  private: boolean;
  updated_at: string;
}

export class GitHubRepository {
  private readonly client: AxiosInstance;
  private readonly basePath = "/github";

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async getConnections(): Promise<GitHubConnection[]> {
    const response = await this.client.get<GitHubConnection[]>(
      `${this.basePath}/connections`,
    );
    return response.data;
  }

  async listRepos(): Promise<GitHubRepo[]> {
    const response = await this.client.get<GitHubRepo[]>(
      `${this.basePath}/repos`,
    );
    return response.data;
  }

  async analyzeRepo(productId: string, repositoryUrl: string, branch?: string): Promise<RepositoryAnalysis> {
    const response = await this.client.post<RepositoryAnalysis>(
      `${this.basePath}/analyze`,
      { product_id: productId, repository_url: repositoryUrl, branch },
    );
    return response.data;
  }

  async getScanHistory(productId: string): Promise<RepoScanHistory[]> {
    const response = await this.client.get<RepoScanHistory[]>(
      `${this.basePath}/scans`,
      { params: { product_id: productId } },
    );
    return response.data;
  }

  async getAnalysis(productId: string): Promise<RepositoryAnalysis | null> {
    const response = await this.client.get<RepositoryAnalysis | null>(
      `${this.basePath}/analysis/${productId}`,
    );
    return response.data;
  }

  async disconnect(connectionId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/connections/${connectionId}`);
  }

  async getRepoInfo(
    repositoryUrl: string,
    githubToken?: string,
  ): Promise<GitHubInfo> {
    const response = await this.client.post<GitHubInfo>(
      `${this.basePath}/repo-info`,
      { repository_url: repositoryUrl, github_token: githubToken },
    );
    return response.data;
  }

  async triggerScan(productId: string): Promise<{ status: string; filesChanged?: number }> {
    const response = await this.client.post<{ status: string; filesChanged?: number }>(
      `${this.basePath}/scan`,
      { product_id: productId },
    );
    return response.data;
  }
}

export const githubRepository = new GitHubRepository();
