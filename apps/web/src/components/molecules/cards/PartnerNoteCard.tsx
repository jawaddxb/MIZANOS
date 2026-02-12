"use client";

import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";

interface PartnerNoteData {
  id: string;
  content: string;
  partner_name: string;
  created_at: string;
  created_by?: string;
}

interface PartnerNoteCardProps {
  note: PartnerNoteData;
  onDelete?: (id: string) => void;
  className?: string;
}

function PartnerNoteCard({ note, onDelete, className }: PartnerNoteCardProps) {
  return (
    <div className={cn("rounded-lg border p-3", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Badge variant="outline" className="text-xs">
            {note.partner_name}
          </Badge>
          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(note.id)}
            className="shrink-0 ml-2"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <p className="text-xs text-muted-foreground">
          {new Date(note.created_at).toLocaleDateString()}
        </p>
        {note.created_by && (
          <p className="text-xs text-muted-foreground">
            by {note.created_by}
          </p>
        )}
      </div>
    </div>
  );
}

export { PartnerNoteCard };
export type { PartnerNoteCardProps, PartnerNoteData };
