"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/atoms/display/Badge";
import { cn } from "@/lib/utils/cn";
import { FeatureBoardCard } from "./FeatureBoardCard";
import type { SpecificationFeature } from "@/lib/types";

interface FeatureBoardColumnProps {
  id: string;
  title: string;
  color: string;
  features: SpecificationFeature[];
  onFeatureClick: (feature: SpecificationFeature) => void;
  onMarkReusable: (feature: SpecificationFeature) => void;
}

export function FeatureBoardColumn({
  id,
  title,
  color,
  features,
  onFeatureClick,
  onMarkReusable,
}: FeatureBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const featureIds = features.map((f) => f.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed p-3 transition-colors",
        color,
        isOver && "bg-accent/30 border-primary/40",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {features.length}
        </Badge>
      </div>
      <SortableContext
        items={featureIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[60px]">
          {features.map((feature) => (
            <FeatureBoardCard
              key={feature.id}
              feature={feature}
              onClick={() => onFeatureClick(feature)}
              onMarkReusable={() => onMarkReusable(feature)}
            />
          ))}
          {features.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No features
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
