"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import { PillarBadge } from "@/components/molecules/indicators/PillarBadge";
import type { TaskTemplate } from "@/lib/types";

interface SortableTemplateRowProps {
  template: TaskTemplate;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (template: TaskTemplate) => void;
  onToggleActive: (template: TaskTemplate, active: boolean) => void;
}

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
};

export function SortableTemplateRow({
  template,
  onEdit,
  onDelete,
  onToggleActive,
}: SortableTemplateRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b transition-colors hover:bg-muted/50",
        isDragging && "opacity-50 bg-muted",
      )}
    >
      <td className="w-10 px-2 py-3">
        <div
          className="cursor-grab active:cursor-grabbing p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </td>
      <td className="px-3 py-3">
        <span className="text-sm font-medium">{template.title}</span>
      </td>
      <td className="px-3 py-3">
        <PillarBadge pillar={template.pillar} className="text-[11px]" />
      </td>
      <td className="px-3 py-3">
        <Badge
          variant={PRIORITY_VARIANT[template.priority ?? "medium"] ?? "outline"}
          className="text-[11px]"
        >
          {(template.priority ?? "medium").charAt(0).toUpperCase() +
            (template.priority ?? "medium").slice(1)}
        </Badge>
      </td>
      <td className="px-3 py-3">
        <Badge variant="outline" className="text-[11px]">
          {(template.default_status ?? "backlog")
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")}
        </Badge>
      </td>
      <td className="px-3 py-3">
        <BaseSwitch
          checked={template.is_active ?? true}
          onCheckedChange={(checked) => onToggleActive(template, checked)}
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <BaseButton
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(template)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(template)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </BaseButton>
        </div>
      </td>
    </tr>
  );
}
