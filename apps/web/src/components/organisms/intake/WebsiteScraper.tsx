"use client";

import * as React from "react";

import { Globe, Loader2, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { Button } from "@/components/molecules/buttons/Button";
import { scrapeRepository } from "@/lib/api/repositories";
import type { ExtractedMarketingData, ScrapedWebsite } from "./types";

interface WebsiteScraperProps {
  websites: ScrapedWebsite[];
  onWebsitesChange: (websites: ScrapedWebsite[]) => void;
}

const URL_PATTERN = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i;

export function WebsiteScraper({ websites, onWebsitesChange }: WebsiteScraperProps) {
  const [url, setUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);

  const SCRAPE_STEPS = React.useMemo(
    () => [
      { label: "Connecting to website...", duration: 2000 },
      { label: "Extracting page content...", duration: 4000 },
      { label: "Capturing screenshots...", duration: 6000 },
      { label: "Processing images & metadata...", duration: 8000 },
      { label: "Analyzing product info...", duration: 12000 },
      { label: "Finalizing results...", duration: 16000 },
    ],
    [],
  );

  React.useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      return;
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1000;
      const nextStep = SCRAPE_STEPS.findIndex((s) => elapsed < s.duration);
      setCurrentStep(
        nextStep === -1 ? SCRAPE_STEPS.length - 1 : nextStep,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, SCRAPE_STEPS]);

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

    try {
      const fullUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      const result = await scrapeRepository.scrape(fullUrl);

      const screenshots = result.screenshot
        ? [{ url: result.screenshot }]
        : null;

      let analysis: ScrapedWebsite["analysis"] = null;
      if (result.content) {
        try {
          analysis = await scrapeRepository.analyze(result.content, fullUrl);
        } catch (err) {
          console.warn("Analysis failed, continuing without it:", err);
        }
      }

      // Merge AI-extracted social handles into link-parsed marketing data
      const marketing: ExtractedMarketingData | null = result.marketing
        ? mergeMarketingHandles(result.marketing, analysis)
        : null;

      const newSite: ScrapedWebsite = {
        url: fullUrl,
        markdown: result.content,
        logo: result.logo ?? null,
        screenshots,
        branding: null,
        metadata: { title: result.title ?? trimmed },
        aiSummary: result.description,
        analysis,
        marketing,
      };

      const updated = [...websites, newSite];
      onWebsitesChange(updated);
      setUrl("");
      toast.success(`Added ${trimmed}`);
    } catch (error) {
      console.error("Scrape error:", error);
      const raw = error instanceof Error ? error.message : "";
      const isTimeout = raw.includes("408") || raw.includes("timeout") || raw.includes("timed out");
      const message = isTimeout
        ? "Scraping timed out. Try a simpler page or a direct URL."
        : raw === "Network Error"
          ? "The scrape request failed — the server may still be processing. Please try again."
          : raw || "Failed to scrape website";
      toast.error(message);
    } finally {
      setIsLoading(false);
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
                Scraping...
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
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>{SCRAPE_STEPS[currentStep].label}</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
              style={{
                width: `${((currentStep + 1) / SCRAPE_STEPS.length) * 100}%`,
              }}
            />
          </div>

          <ul className="space-y-1.5">
            {SCRAPE_STEPS.map((step, i) => (
              <li
                key={step.label}
                className="flex items-center gap-2 text-xs"
              >
                {i < currentStep ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                ) : i === currentStep ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                )}
                <span
                  className={
                    i <= currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
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
                className="rounded-md border p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium">
                      {site.analysis?.productName || site.metadata?.title || site.url}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground truncate pl-6">
                  {site.url}
                </p>
                {site.analysis && (
                  <div className="mt-2 pl-6 space-y-1">
                    {site.analysis.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {site.analysis.description}
                      </p>
                    )}
                    {site.analysis.features.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {site.analysis.features.length} features identified
                        {site.analysis.techIndicators.length > 0 && (
                          <> &middot; Tech: {site.analysis.techIndicators.slice(0, 3).join(", ")}</>
                        )}
                      </p>
                    )}
                  </div>
                )}
                {!site.analysis && site.aiSummary && (
                  <p className="mt-1 pl-6 text-xs text-muted-foreground truncate">
                    {site.aiSummary}
                  </p>
                )}
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

function mergeMarketingHandles(
  marketing: ExtractedMarketingData,
  analysis: ScrapedWebsite["analysis"],
): ExtractedMarketingData {
  if (!analysis?.socialHandles?.length) return marketing;

  const existing = new Set(
    marketing.socialHandles.map((h) => `${h.platform.toLowerCase()}:${h.handle.toLowerCase()}`),
  );

  const merged = [...marketing.socialHandles];
  for (const ai of analysis.socialHandles) {
    const handle = ai.handle.replace(/^@/, "");
    const key = `${ai.platform.toLowerCase()}:${handle.toLowerCase()}`;
    if (!existing.has(key)) {
      existing.add(key);
      merged.push({ platform: ai.platform, handle, url: null });
    }
  }

  return { ...marketing, socialHandles: merged };
}
