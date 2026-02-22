"use client";

import { useState } from "react";
import { Pencil, Check } from "lucide-react";

interface EditableListItemProps {
  value: string;
  onSave: (next: string) => void;
  onRemove: () => void;
}

export function EditableListItem({ value, onSave, onRemove }: EditableListItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => {
    const trimmed = draft.trim();
    trimmed.length === 0 ? onRemove() : onSave(trimmed);
    setEditing(false);
  };
  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" value={draft}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commit()} autoFocus />
        <button type="button" onClick={commit} className="text-green-600"><Check className="h-4 w-4" /></button>
      </div>
    );
  }
  return (
    <div className="group flex items-center justify-between text-sm">
      <span>{value}</span>
      <button type="button" onClick={() => setEditing(true)} className="opacity-0 transition-opacity group-hover:opacity-100">
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}
