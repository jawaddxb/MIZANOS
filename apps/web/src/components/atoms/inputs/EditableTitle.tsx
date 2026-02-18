"use client";

import * as React from "react";
import { Pencil, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface EditableTitleProps {
  value: string;
  onSave: (newValue: string) => void;
  isLoading?: boolean;
  className?: string;
}

const EditableTitle = React.forwardRef<HTMLDivElement, EditableTitleProps>(
  ({ value, onSave, isLoading, className }, ref) => {
    const [editing, setEditing] = React.useState(false);
    const [draft, setDraft] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      setDraft(value);
    }, [value]);

    React.useEffect(() => {
      if (editing) {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }, [editing]);

    const save = () => {
      const trimmed = draft.trim();
      if (trimmed && trimmed !== value) {
        onSave(trimmed);
      } else {
        setDraft(value);
      }
      setEditing(false);
    };

    const cancel = () => {
      setDraft(value);
      setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    };

    if (editing) {
      return (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          className={cn(
            "text-2xl font-semibold bg-transparent border-b-2 border-primary outline-none w-full",
            className,
          )}
        />
      );
    }

    return (
      <div ref={ref} className="group flex items-center gap-2">
        <h1 className={cn("text-2xl font-semibold", className)}>{value}</h1>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
            aria-label="Edit title"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  },
);
EditableTitle.displayName = "EditableTitle";

export { EditableTitle };
