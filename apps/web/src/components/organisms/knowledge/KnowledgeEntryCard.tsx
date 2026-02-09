"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { Badge } from "@/components/atoms/display/Badge";
import type { KnowledgeEntry } from "@/lib/types/knowledge";

interface KnowledgeEntryCardProps {
  entry: KnowledgeEntry;
  onEdit?: (entry: KnowledgeEntry) => void;
  onDelete?: (id: string) => void;
}

const categoryLabels: Record<string, string> = {
  bizdev: "BizDev",
  product: "Product Features",
  dev_knowledge: "Dev Knowledge",
  general: "General",
};

export function KnowledgeEntryCard({ entry, onEdit, onDelete }: KnowledgeEntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(entry.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">{entry.title}</h3>
            <Badge variant="secondary" className="text-xs shrink-0">
              {categoryLabels[entry.category] ?? entry.category}
            </Badge>
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
          </div>
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
          <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
        </div>
      )}
    </div>
  );
}
