import type { AxiosInstance } from "axios";
import { apiClient } from "../client";

export interface ExtractedDomainInfo {
  domain: string;
  ssl_status: string;
  is_secured: boolean;
}

export interface ExtractedSocialHandle {
  platform: string;
  handle: string;
  url?: string | null;
}

export interface ExtractedMarketingData {
  domain: ExtractedDomainInfo;
  socialHandles: ExtractedSocialHandle[];
  contactEmails: string[];
}

export interface ScrapeResult {
  content: string;
  title: string | null;
  description: string | null;
  images: string[];
  screenshot: string | null;
  logo: string | null;
  links: string[];
  marketing: ExtractedMarketingData | null;
}

export interface ScrapedAnalysis {
  productName: string;
  description: string;
  features: string[];
  targetAudience: string;
  pricingModel: string;
  techIndicators: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialHandles?: Array<{ platform: string; handle: string }>;
}

export class ScrapeRepository {
  private readonly client: AxiosInstance;
  private readonly basePath = "/scrape";

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async scrape(url: string, mode: string = "single"): Promise<ScrapeResult> {
    const response = await this.client.post<ScrapeResult>(
      this.basePath,
      { url, mode },
      { timeout: 90_000 },
    );
    return response.data;
  }

  async analyze(content: string, url: string): Promise<ScrapedAnalysis> {
    const response = await this.client.post<ScrapedAnalysis>(
      `${this.basePath}/analyze`,
      { content, url },
      { timeout: 60_000 },
    );
    return response.data;
  }
}

export const scrapeRepository = new ScrapeRepository();
