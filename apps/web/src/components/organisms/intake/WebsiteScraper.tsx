"use client";

import * as React from "react";

import { Globe, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { scrapeRepository } from "@/lib/api/repositories";
import type { ScrapedWebsite } from "./types";

interface WebsiteScraperProps {
  websites: ScrapedWebsite[];
  onWebsitesChange: (websites: ScrapedWebsite[]) => void;
}

const URL_PATTERN = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i;

export function WebsiteScraper({ websites, onWebsitesChange }: WebsiteScraperProps) {
  const [url, setUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingStatus, setLoadingStatus] = React.useState("");

  const handleScrape = React.useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Please enter a URL");
      return;
    }
    if (!URL_PATTERN.test(trimmed)) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    setLoadingStatus("Scraping website...");

    try {
      const fullUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      const result = await scrapeRepository.scrape(fullUrl);

      const screenshots = result.screenshot
        ? [{ url: result.screenshot }]
        : null;

      const newSite: ScrapedWebsite = {
        url: fullUrl,
        markdown: result.content,
        logo: result.logo ?? null,
        screenshots,
        branding: null,
        metadata: { title: result.title ?? trimmed },
        aiSummary: result.description,
      };

      const updated = [...websites, newSite];
      onWebsitesChange(updated);
      setUrl("");
      toast.success(`Added ${trimmed}`);
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to scrape website");
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  }, [url, websites, onWebsitesChange]);

  const handleRemove = React.useCallback(
    (index: number) => {
      onWebsitesChange(websites.filter((_, i) => i !== index));
    },
    [websites, onWebsitesChange],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <BaseLabel htmlFor="website-url">Website URL</BaseLabel>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <BaseInput
              id="website-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="pl-9"
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleScrape()}
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleScrape} disabled={isLoading || !url.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingStatus || "Scraping..."}
              </>
            ) : (
              "Scrape"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter a website URL to extract content and screenshots
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      )}

      {websites.length > 0 && !isLoading && (
        <div className="space-y-2">
          <BaseLabel className="text-sm font-medium">
            Scraped Websites ({websites.length})
          </BaseLabel>
          <ul className="space-y-2">
            {websites.map((site, index) => (
              <li
                key={`${site.url}-${index}`}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{site.url}</span>
                  {site.aiSummary && (
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {site.aiSummary.slice(0, 60)}...
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {websites.length === 0 && !isLoading && (
        <div className="py-8 text-center text-muted-foreground">
          <Globe className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <p className="text-sm">No websites scraped yet</p>
          <p className="mt-1 text-xs">
            Enter a URL above to extract content and screenshots
          </p>
        </div>
      )}
    </div>
  );
}
