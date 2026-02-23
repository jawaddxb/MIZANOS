"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Badge } from "@/components/atoms/display/Badge";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";
import { EnhancedMarkdownViewer } from "@/components/molecules/display/EnhancedMarkdownViewer";
import type { SpecSource } from "./SourceCard";

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
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isMarkdown ? (
            <EnhancedMarkdownViewer content={content} />
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {content}
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function resolveDialogTitle(source: SpecSource): string {
  if (source.source_type === "paste") return "User Provided Text";
  if (source.source_type === "markdown") return "Markdown Notes";
  return `${source.source_type} source`;
}
