"use client";

import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/molecules/buttons/Button";

interface ManagementNoteData {
  id: string;
  content: string;
  created_at: string;
  created_by?: string;
  is_pinned?: boolean;
}

interface ManagementNoteCardProps {
  note: ManagementNoteData;
  onDelete?: (id: string) => void;
  className?: string;
}

function ManagementNoteCard({ note, onDelete, className }: ManagementNoteCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        note.is_pinned && "border-primary/30 bg-primary/5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
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

export { ManagementNoteCard };
export type { ManagementNoteCardProps, ManagementNoteData };
