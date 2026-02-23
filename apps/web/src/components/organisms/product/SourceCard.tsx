"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import {
  Globe,
  FileText,
  Mic,
  GitBranch,
  ExternalLink,
  Code,
  ClipboardPaste,
  Download,
  Loader2,
  Settings2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { specificationsRepository } from "@/lib/api/repositories";
import { formatDistanceToNow } from "date-fns";
import type { JsonValue } from "@/lib/types";
import { SourceContentDialog } from "./SourceContentDialog";

export interface SpecSource {
  id: string;
  source_type: string;
  file_name?: string | null;
  file_url?: string | null;
  url?: string | null;
  raw_content?: string | null;
  transcription?: string | null;
  ai_summary?: Record<string, JsonValue> | null;
  logo_url?: string | null;
  screenshots?: Record<string, JsonValue> | null;
  branding?: Record<string, JsonValue> | null;
  created_at: string;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  document: <FileText className="h-4 w-4" />,
  audio: <Mic className="h-4 w-4" />,
  markdown: <Code className="h-4 w-4" />,
  paste: <ClipboardPaste className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  github: <GitBranch className="h-4 w-4" />,
  instructions: <Settings2 className="h-4 w-4" />,
};

const VIEWABLE_TYPES = new Set(["markdown", "paste"]);

export function SourceCard({ source }: { source: SpecSource }) {
  const [viewOpen, setViewOpen] = useState(false);
  const icon = SOURCE_ICONS[source.source_type] || <FileText className="h-4 w-4" />;
  const canView = VIEWABLE_TYPES.has(source.source_type) && !!source.raw_content;

  return (
    <>
      <Card className={canView ? "cursor-pointer hover:border-primary/40 transition-colors" : undefined} onClick={canView ? () => setViewOpen(true) : undefined}>
        <CardContent className="flex items-start gap-3 p-4">
          <SourceIcon icon={icon} logoUrl={source.logo_url} />
          <div className="flex-1 min-w-0">
            <SourceHeader source={source} />
            <SourceBody source={source} />
            <p className="text-xs text-muted-foreground mt-1">
              Added {formatDistanceToNow(new Date(source.created_at), { addSuffix: true })}
            </p>
          </div>
          <SourceActions source={source} />
        </CardContent>
      </Card>
      {canView && (
        <SourceContentDialog source={source} open={viewOpen} onOpenChange={setViewOpen} />
      )}
    </>
  );
}

function SourceIcon({ icon, logoUrl }: { icon: React.ReactNode; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Site logo"
        className="h-8 w-8 rounded-lg object-contain flex-shrink-0"
      />
    );
  }
  return <div className="p-2 rounded-lg bg-secondary flex-shrink-0">{icon}</div>;
}

const SOURCE_LABELS: Record<string, string> = {
  paste: "open text",
};

const SOURCE_TITLES: Record<string, string> = {
  paste: "User Provided Text",
  markdown: "Markdown Notes",
};

function SourceHeader({ source }: { source: SpecSource }) {
  const title = resolveTitle(source);
  const label = SOURCE_LABELS[source.source_type] ?? source.source_type;
  return (
    <div className="flex items-center gap-2">
      <p className="text-sm font-medium truncate">{title}</p>
      <Badge variant="outline" className="text-xs">{label}</Badge>
    </div>
  );
}

function SourceBody({ source }: { source: SpecSource }) {
  switch (source.source_type) {
    case "website":
      return <WebsiteBody source={source} />;
    case "github":
      return <GitHubBody source={source} />;
    case "audio":
      return <AudioBody source={source} />;
    case "document":
      return <DocumentBody source={source} />;
    default:
      return <ContentPreview content={source.raw_content} />;
  }
}

function WebsiteBody({ source }: { source: SpecSource }) {
  const summary = source.ai_summary;
  const analysis = summary?.analysis as Record<string, JsonValue> | undefined;

  return (
    <div className="mt-1 space-y-1">
      {source.url && (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
          {source.url}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      )}
      {summary?.summary && (
        <p className="text-xs text-muted-foreground line-clamp-2">{String(summary.summary)}</p>
      )}
      {analysis && (
        <div className="flex flex-wrap gap-1.5">
          {Array.isArray(analysis.features) && (
            <Badge variant="secondary" className="text-[10px]">{analysis.features.length} features</Badge>
          )}
          {analysis.targetAudience && (
            <Badge variant="secondary" className="text-[10px]">{String(analysis.targetAudience)}</Badge>
          )}
        </div>
      )}
      <ContentPreview content={source.raw_content} />
    </div>
  );
}

function GitHubBody({ source }: { source: SpecSource }) {
  const parsed = parseGitHubContent(source.raw_content);
  return (
    <div className="mt-1 space-y-1">
      {source.url && (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
          {source.url}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      )}
      {Array.isArray(parsed?.techStack) && parsed.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {parsed.techStack.slice(0, 8).map((tech) => (
            <Badge key={String(tech)} variant="secondary" className="text-[10px]">{String(tech)}</Badge>
          ))}
        </div>
      )}
      {parsed?.branch && typeof parsed.branch === "string" && (
        <p className="text-xs text-muted-foreground">Branch: {parsed.branch}</p>
      )}
    </div>
  );
}

function parseGitHubContent(raw: string | null | undefined): Record<string, JsonValue> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function AudioBody({ source }: { source: SpecSource }) {
  return source.transcription ? (
    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{source.transcription}</p>
  ) : null;
}

function DocumentBody({ source }: { source: SpecSource }) {
  const hasExtractedContent = source.raw_content && !source.raw_content.startsWith("[Binary file:");
  return hasExtractedContent ? (
    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{source.raw_content!.slice(0, 300)}</p>
  ) : null;
}

function ContentPreview({ content }: { content?: string | null }) {
  if (!content) return null;
  return (
    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{content.slice(0, 300)}</p>
  );
}

function SourceActions({ source }: { source: SpecSource }) {
  return (
    <div className="flex items-center gap-1">
      {source.file_url && source.source_type === "audio" && (
        <PlayButton sourceId={source.id} />
      )}
      {source.file_url && <DownloadButton sourceId={source.id} />}
      {source.url && (
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </a>
      )}
    </div>
  );
}

function DownloadButton({ sourceId }: { sourceId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const url = await specificationsRepository.getDownloadUrl(sourceId);
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to get download link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleDownload} disabled={loading} title="Download file">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      )}
    </button>
  );
}

function PlayButton({ sourceId }: { sourceId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    setLoading(true);
    try {
      const url = await specificationsRepository.getDownloadUrl(sourceId);
      const audio = new Audio(url);
      await audio.play();
    } catch {
      toast.error("Failed to play audio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handlePlay} disabled={loading} title="Play audio">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Play className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      )}
    </button>
  );
}

function resolveTitle(source: SpecSource): string {
  if (source.file_name) return source.file_name;
  if (SOURCE_TITLES[source.source_type]) return SOURCE_TITLES[source.source_type];
  if (source.ai_summary?.title) return String(source.ai_summary.title);
  if (source.url) return source.url;
  return `${source.source_type} source`;
}
