"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { cn } from "@/lib/utils/cn";
import { GripVertical, Star, Library } from "lucide-react";
import type { SpecificationFeature } from "@/lib/types";

type FeaturePriority = "low" | "medium" | "high" | "critical";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-secondary text-muted-foreground",
  medium: "bg-status-warning/10 text-status-warning",
  high: "bg-status-warning/10 text-status-warning",
  critical: "bg-status-critical/10 text-status-critical",
};

interface FeatureBoardCardProps {
  feature: SpecificationFeature;
  onClick: () => void;
  onMarkReusable: () => void;
}

export function FeatureBoardCard({
  feature,
  onClick,
  onMarkReusable,
}: FeatureBoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow group",
        isDragging && "opacity-50 shadow-lg",
        feature.is_reusable && "ring-1 ring-primary/20",
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div
            className="cursor-grab active:cursor-grabbing mt-0.5 shrink-0"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-medium truncate">{feature.name}</p>
                {feature.is_reusable && (
                  <Library className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkReusable();
                }}
                className="shrink-0 p-0.5 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                title={feature.is_reusable ? "Edit library entry" : "Add to library"}
              >
                <Star
                  className={cn(
                    "h-3 w-3",
                    feature.is_reusable
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
              </button>
            </div>
            {feature.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {feature.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={cn(
                  "text-[10px]",
                  PRIORITY_STYLES[feature.priority] ?? PRIORITY_STYLES.medium,
                )}
              >
                {feature.priority}
              </Badge>
              {feature.github_path && (
                <span className="text-[10px] text-muted-foreground font-mono truncate">
                  {feature.github_path}
                </span>
              )}
              {feature.is_reusable && feature.reusable_category && (
                <Badge variant="secondary" className="text-[10px]">
                  {feature.reusable_category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
