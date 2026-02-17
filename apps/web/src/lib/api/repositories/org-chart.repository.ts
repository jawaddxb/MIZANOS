import type { AxiosInstance } from "axios";
import { apiClient } from "../client";
import type { OrgChartNode, UpdateReportingLineRequest } from "@/lib/types";

export class OrgChartRepository {
  private readonly client: AxiosInstance;
  private readonly basePath = "/org-chart";

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async getTree(): Promise<OrgChartNode[]> {
    const response = await this.client.get<OrgChartNode[]>(this.basePath);
    return response.data;
  }

  async updateReportingLine(
    profileId: string,
    data: UpdateReportingLineRequest,
  ): Promise<{ message: string }> {
    const response = await this.client.patch<{ message: string }>(
      `${this.basePath}/${profileId}/reporting-line`,
      data,
    );
    return response.data;
  }

  async resendInvite(profileId: string): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>(
      `${this.basePath}/${profileId}/resend-invite`,
    );
    return response.data;
  }
}

export const orgChartRepository = new OrgChartRepository();
