"use client";

import { Pencil, Trash2, ListChecks } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import type { TaskTemplateGroup } from "@/lib/types";

interface TemplateGroupCardProps {
  group: TaskTemplateGroup;
  onEdit: (group: TaskTemplateGroup) => void;
  onDelete: (group: TaskTemplateGroup) => void;
  onToggleActive: (group: TaskTemplateGroup, active: boolean) => void;
}

function formatSourceType(sourceType: string): string {
  return sourceType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function TemplateGroupCard({
  group,
  onEdit,
  onDelete,
  onToggleActive,
}: TemplateGroupCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors group/card">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/templates/${group.id}`}
          className="flex-1 min-w-0 cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <ListChecks className="h-4 w-4 text-muted-foreground shrink-0" />
            <h3 className="font-medium text-sm">{group.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {group.item_count} {group.item_count === 1 ? "step" : "steps"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatSourceType(group.source_type)}
            </Badge>
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 ml-6">
              {group.description}
            </p>
          )}
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <BaseSwitch
            checked={group.is_active ?? true}
            onCheckedChange={(checked) => onToggleActive(group, checked)}
          />
          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <BaseButton
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.preventDefault();
                onEdit(group);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                onDelete(group);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  );
}
