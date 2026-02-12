"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/molecules/buttons/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/atoms/layout/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import type { TaskTemplateGroup } from "@/lib/types";
import type { ProjectSourceType } from "@/lib/types/enums";

const SOURCE_TYPES: ProjectSourceType[] = [
  "lovable_port",
  "replit_port",
  "github_unscaffolded",
  "greenfield",
  "external_handoff",
  "in_progress",
  "in_progress_standards",
  "in_progress_legacy",
];

interface TemplateGroupEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: TaskTemplateGroup | null;
  onSave: (data: Partial<TaskTemplateGroup>) => void;
  isSaving: boolean;
}

export function TemplateGroupEditor({
  open,
  onOpenChange,
  group,
  onSave,
  isSaving,
}: TemplateGroupEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState<string>("greenfield");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description ?? "");
      setSourceType(group.source_type);
      setIsActive(group.is_active ?? true);
    } else {
      setName("");
      setDescription("");
      setSourceType("greenfield");
      setIsActive(true);
    }
  }, [group, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      source_type: sourceType as ProjectSourceType,
      is_active: isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {group ? "Edit Template Group" : "Create Template Group"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name *</label>
            <BaseInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App Setup"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <BaseTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this workflow achieves"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Source Type</label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Active</label>
              <div className="pt-2">
                <BaseSwitch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Saving..." : group ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
