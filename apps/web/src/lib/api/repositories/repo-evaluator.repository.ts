import type { BrowseResponse, EvaluationResult } from "@/lib/types/repo-evaluator";
import { BaseRepository } from "./base.repository";

export class RepoEvaluatorRepository extends BaseRepository<EvaluationResult> {
  protected readonly basePath = "/repo-evaluator";

  async evaluate(repoPath: string): Promise<EvaluationResult> {
    const response = await this.client.post<EvaluationResult>(
      `${this.basePath}/evaluate`,
      { repo_path: repoPath },
    );
    return response.data;
  }

  async browse(path?: string): Promise<BrowseResponse> {
    const response = await this.client.get<BrowseResponse>(
      `${this.basePath}/browse`,
      { params: path ? { path } : {} },
    );
    return response.data;
  }
}

export const repoEvaluatorRepository = new RepoEvaluatorRepository();
