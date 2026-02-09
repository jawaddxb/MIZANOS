import type { AxiosInstance } from "axios";
import type { AIChatSession, AIChatMessage } from "@/lib/types";
import { apiClient } from "../client";

export class AIRepository {
  private readonly client: AxiosInstance;
  private readonly basePath = "/ai/chat";

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async getSessions(): Promise<AIChatSession[]> {
    const response = await this.client.get<AIChatSession[]>(`${this.basePath}/sessions`);
    return response.data;
  }

  async getSession(sessionId: string): Promise<AIChatSession> {
    const response = await this.client.get<AIChatSession>(
      `${this.basePath}/sessions/${sessionId}`,
    );
    return response.data;
  }

  async createSession(productId?: string): Promise<AIChatSession> {
    const response = await this.client.post<AIChatSession>(
      `${this.basePath}/sessions`,
      { product_id: productId },
    );
    return response.data;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/sessions/${sessionId}`);
  }

  async getMessages(sessionId: string): Promise<AIChatMessage[]> {
    const response = await this.client.get<AIChatMessage[]>(
      `${this.basePath}/sessions/${sessionId}/messages`,
    );
    return response.data;
  }

  async sendMessage(sessionId: string, content: string): Promise<AIChatMessage> {
    const response = await this.client.post<AIChatMessage>(
      `${this.basePath}/sessions/${sessionId}/messages`,
      { content, role: "user" },
    );
    return response.data;
  }
}

export const aiRepository = new AIRepository();
