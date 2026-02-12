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
import type { TaskTemplate } from "@/lib/types";
import type { ProjectSourceType } from "@/lib/types/enums";

const PILLARS = ["development", "product", "business", "marketing"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;
const STATUSES = ["backlog", "in_progress", "review", "done"] as const;

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

interface TaskTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TaskTemplate | null;
  onSave: (data: Partial<TaskTemplate>) => void;
  isSaving: boolean;
  groupId?: string;
}

export function TaskTemplateEditor({
  open,
  onOpenChange,
  template,
  onSave,
  isSaving,
  groupId,
}: TaskTemplateEditorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pillar, setPillar] = useState("development");
  const [priority, setPriority] = useState("medium");
  const [defaultStatus, setDefaultStatus] = useState("backlog");
  const [sourceType, setSourceType] = useState<string>("greenfield");
  const [orderIndex, setOrderIndex] = useState("0");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description ?? "");
      setPillar(template.pillar);
      setPriority(template.priority ?? "medium");
      setDefaultStatus(template.default_status ?? "backlog");
      setSourceType(template.source_type);
      setOrderIndex(String(template.order_index ?? 0));
      setIsActive(template.is_active ?? true);
    } else {
      setTitle("");
      setDescription("");
      setPillar("development");
      setPriority("medium");
      setDefaultStatus("backlog");
      setSourceType("greenfield");
      setOrderIndex("0");
      setIsActive(true);
    }
  }, [template, open]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      pillar,
      priority,
      default_status: defaultStatus,
      source_type: sourceType as ProjectSourceType,
      order_index: parseInt(orderIndex, 10) || 0,
      is_active: isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Task Template" : "Create Task Template"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <BaseInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Template title"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <BaseTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Pillar"
              value={pillar}
              onValueChange={setPillar}
              options={PILLARS}
            />
            <FormSelect
              label="Priority"
              value={priority}
              onValueChange={setPriority}
              options={PRIORITIES}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Default Status"
              value={defaultStatus}
              onValueChange={setDefaultStatus}
              options={STATUSES}
            />
            {!groupId && (
              <FormSelect
                label="Source Type"
                value={sourceType}
                onValueChange={setSourceType}
                options={SOURCE_TYPES}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!groupId && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Order Index</label>
                <BaseInput
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(e.target.value)}
                />
              </div>
            )}
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
            disabled={isSaving || !title.trim()}
          >
            {isSaving ? "Saving..." : template ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (val: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
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
  );
}
