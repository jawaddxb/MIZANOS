import type { AxiosInstance } from "axios";
import { apiClient } from "../client";

export interface ScrapeResult {
  content: string;
  title: string | null;
  description: string | null;
  images: string[];
  screenshot: string | null;
  logo: string | null;
}

export class ScrapeRepository {
  private readonly client: AxiosInstance;
  private readonly basePath = "/scrape";

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async scrape(url: string, mode: string = "single"): Promise<ScrapeResult> {
    const response = await this.client.post<ScrapeResult>(this.basePath, {
      url,
      mode,
    });
    return response.data;
  }
}

export const scrapeRepository = new ScrapeRepository();
