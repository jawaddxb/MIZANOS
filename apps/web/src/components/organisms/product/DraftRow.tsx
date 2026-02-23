"use client";

import { Check, X, FileText, LayoutTemplate, Sparkles } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";

const SOURCE_CONFIG: Record<string, { label: string; icon: typeof FileText }> = {
  specification: { label: "Spec", icon: FileText },
  template: { label: "Template", icon: LayoutTemplate },
  lovable_port: { label: "Lovable", icon: Sparkles },
};


export type DraftTask = {
  id: string;
  title: string;
  description: string | null;
  generation_source: string | null;
  pillar: string | null;
  priority: string | null;
};

interface DraftRowProps {
  task: DraftTask;
  selected: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onViewDetail: () => void;
}

export function DraftRow({ task, selected, onToggle, onApprove, onReject, onViewDetail }: DraftRowProps) {
  const source = SOURCE_CONFIG[task.generation_source ?? ""] ?? null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
      <BaseCheckbox checked={selected} onCheckedChange={onToggle} />
      <button type="button" className="flex-1 min-w-0 text-left" onClick={onViewDetail}>
        <p className="text-sm font-medium truncate">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {task.description}
          </p>
        )}
      </button>
      <div className="flex items-center gap-2 shrink-0">
        {source && (
          <Badge variant="secondary" className="text-xs">
            <source.icon className="h-3 w-3 mr-1" />
            {source.label}
          </Badge>
        )}
        {task.pillar && (
          <Badge variant="outline" className="text-xs capitalize">{task.pillar}</Badge>
        )}
        {task.priority && (
          <Badge variant="outline" className="text-xs capitalize">{task.priority}</Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-green-600"
          onClick={onApprove}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-600"
          onClick={onReject}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
