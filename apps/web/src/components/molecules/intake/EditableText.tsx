"use client";

import { useState, useEffect } from "react";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { Button } from "@/components/molecules/buttons/Button";

interface EditableTextProps {
  value: string;
  onSave: (v: string) => void;
}

export function EditableText({ value, onSave }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <BaseTextarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[80px]" />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          <Button size="sm" onClick={commit}>Save</Button>
        </div>
      </div>
    );
  }

  return (
    <button type="button" className="w-full text-left text-sm leading-relaxed hover:bg-muted/50 rounded-md p-2 -m-2" onClick={() => setEditing(true)}>
      {value || <span className="text-muted-foreground italic">Click to add...</span>}
    </button>
  );
}
