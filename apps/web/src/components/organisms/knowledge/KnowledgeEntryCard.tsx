"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { CategoryBadge } from "@/components/molecules/indicators/CategoryBadge";
import { EnhancedMarkdownViewer } from "@/components/molecules/display/EnhancedMarkdownViewer";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";
import { CATEGORY_COLOR_MAP, estimateReadingTime } from "@/lib/constants/knowledge";
import { cn } from "@/lib/utils/cn";
import type { KnowledgeEntry } from "@/lib/types/knowledge";

interface KnowledgeEntryCardProps {
  entry: KnowledgeEntry;
  onEdit?: (entry: KnowledgeEntry) => void;
  onDelete?: (id: string) => void;
  style?: React.CSSProperties;
}

/** Strip markdown syntax for plain-text preview. */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[*_`~>]/g, "")
    .replace(/\[!(?:info|warning|error|tip)\]\s*/gi, "")
    .replace(/\n+/g, " ")
    .trim();
}

export function KnowledgeEntryCard({ entry, onEdit, onDelete, style }: KnowledgeEntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(entry.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const categoryInfo = CATEGORY_COLOR_MAP[entry.category];
  const borderClass = categoryInfo?.borderClass ?? "border-l-muted-foreground";
  const readingTime = entry.content ? estimateReadingTime(entry.content) : null;
  const preview = entry.content ? stripMarkdown(entry.content).slice(0, 120) : null;

  return (
    <div
      className={cn("rounded-lg border border-l-4 bg-card p-4 transition-shadow hover:shadow-sm", borderClass)}
      style={style}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">{entry.title}</h3>
            <CategoryBadge category={entry.category} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
            {entry.source_type && (
              <>
                <span>·</span>
                <span className="capitalize">{entry.source_type}</span>
              </>
            )}
            {readingTime && (
              <>
                <span>·</span>
                <Clock className="h-3 w-3" />
                <span>~{readingTime} min read</span>
              </>
            )}
          </div>
          {!expanded && preview && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{preview}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && entry.content && (
        <div className="mt-3 pt-3 border-t">
          <ScrollArea className="max-h-[500px]">
            <EnhancedMarkdownViewer content={entry.content} showToc={false} showProgress={false} />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
