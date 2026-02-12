import type { AxiosInstance } from "axios";
import type {
  EngineerEvaluation,
  EvaluationSummary,
  ProjectCompletion,
} from "@/lib/types";
import { apiClient } from "../client";

export class EvaluationRepository {
  private readonly client: AxiosInstance;
  private readonly basePath = "/evaluations";

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async getEvaluations(profileId: string): Promise<EngineerEvaluation[]> {
    const response = await this.client.get<EngineerEvaluation[]>(
      `${this.basePath}/${profileId}`,
    );
    return response.data;
  }

  async getLatestEvaluation(
    profileId: string,
  ): Promise<EngineerEvaluation | null> {
    const response = await this.client.get<EngineerEvaluation>(
      `${this.basePath}/${profileId}/latest`,
    );
    return response.data;
  }

  async getAllSummaries(): Promise<EvaluationSummary[]> {
    const response = await this.client.get<EvaluationSummary[]>(
      `${this.basePath}/summaries`,
    );
    return response.data;
  }

  async createEvaluation(
    profileId: string,
    data: Omit<
      EngineerEvaluation,
      "id" | "profile_id" | "evaluated_by" | "overall_score" | "created_at" | "updated_at"
    >,
  ): Promise<EngineerEvaluation> {
    const response = await this.client.post<EngineerEvaluation>(
      `${this.basePath}/${profileId}`,
      data,
    );
    return response.data;
  }

  async getCompletions(profileId: string): Promise<ProjectCompletion[]> {
    const response = await this.client.get<ProjectCompletion[]>(
      `${this.basePath}/${profileId}/completions`,
    );
    return response.data;
  }

  async createCompletion(
    profileId: string,
    data: {
      product_id: string;
      score?: number;
      quality_rating?: number;
      timeliness_rating?: number;
      collaboration_rating?: number;
      feedback?: string;
      role_on_project?: string;
      skills_demonstrated?: string[];
    },
  ): Promise<ProjectCompletion> {
    const response = await this.client.post<ProjectCompletion>(
      `${this.basePath}/${profileId}/completions`,
      data,
    );
    return response.data;
  }

  async getSummary(profileId: string): Promise<EvaluationSummary> {
    const response = await this.client.get<EvaluationSummary>(
      `${this.basePath}/${profileId}/summary`,
    );
    return response.data;
  }
}

export const evaluationRepository = new EvaluationRepository();
