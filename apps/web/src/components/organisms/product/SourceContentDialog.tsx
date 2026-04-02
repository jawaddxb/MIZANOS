"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Badge } from "@/components/atoms/display/Badge";
import { EnhancedMarkdownViewer } from "@/components/molecules/display/EnhancedMarkdownViewer";
import type { SpecSource } from "./SourceCard";
import type { JsonValue } from "@/lib/types";

interface SourceContentDialogProps {
  source: SpecSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LABEL_MAP: Record<string, string> = {
  paste: "open text",
  markdown: "markdown",
};

export function SourceContentDialog({ source, open, onOpenChange }: SourceContentDialogProps) {
  if (!source) return null;

  const title = source.file_name || resolveDialogTitle(source);
  const label = LABEL_MAP[source.source_type] ?? source.source_type;
  const isMarkdown = source.source_type === "markdown";
  const content = source.raw_content ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            <Badge variant="outline" className="text-xs">{label}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6 max-h-[60vh]">
          {source.ai_summary && <EnrichedSummary summary={source.ai_summary} />}
          {isMarkdown ? (
            <EnhancedMarkdownViewer content={content} />
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {content}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EnrichedSummary({ summary }: { summary: Record<string, JsonValue> }) {
  const title = summary.title as string | undefined;
  const summaryText = summary.summary as string | undefined;
  const sections = (summary.sections ?? []) as Array<{ heading: string; details: string[] }>;
  const entities = (summary.key_entities ?? []) as Array<{ name: string; role: string }>;
  const metrics = (summary.metrics ?? []) as string[];

  if (!summaryText && sections.length === 0 && entities.length === 0) return null;

  return (
    <div className="mb-4 p-3 rounded-lg border bg-primary/5 space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">AI Enriched</Badge>
        {title && <span className="text-sm font-medium">{title}</span>}
      </div>
      {summaryText && <p className="text-xs text-muted-foreground">{summaryText}</p>}
      {sections.map((section, i) => (
        <div key={i}>
          <p className="text-xs font-semibold">{section.heading}</p>
          <ul className="ml-4 space-y-0.5">
            {section.details.map((d, j) => (
              <li key={j} className="text-xs text-muted-foreground list-disc">{d}</li>
            ))}
          </ul>
        </div>
      ))}
      {entities.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1">Key Entities</p>
          <div className="flex flex-wrap gap-1">
            {entities.map((e, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">{e.name}{e.role ? ` — ${e.role}` : ""}</Badge>
            ))}
          </div>
        </div>
      )}
      {metrics.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1">Metrics</p>
          <ul className="ml-4 space-y-0.5">
            {metrics.map((m, i) => (
              <li key={i} className="text-xs text-muted-foreground list-disc">{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function resolveDialogTitle(source: SpecSource): string {
  if (source.source_type === "paste") return "User Provided Text";
  if (source.source_type === "markdown") return "Markdown Notes";
  return `${source.source_type} source`;
}
