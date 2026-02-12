"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { cn } from "@/lib/utils/cn";
import { Plus, Loader2, Layers, Library } from "lucide-react";
import { useSpecificationFeatures } from "@/hooks/queries/useSpecificationFeatures";
import {
  useUpdateSpecFeature,
  useQueueFeature,
  useUnqueueFeature,
} from "@/hooks/mutations/useSpecificationFeatureMutations";
import { FeatureBoardColumn } from "./FeatureBoardColumn";
import { AddFeatureDialog } from "./AddFeatureDialog";
import { EditFeatureDialog } from "./EditFeatureDialog";
import { ImportFromLibraryDialog } from "./ImportFromLibraryDialog";
import { MarkReusableDialog } from "./MarkReusableDialog";
import type { SpecificationFeature } from "@/lib/types";

export interface FeaturesTabProps {
  productId: string;
}

type FeatureStatus = "proposed" | "approved" | "queued" | "in_progress" | "done";

const COLUMNS: { id: FeatureStatus; title: string; color: string }[] = [
  { id: "proposed", title: "Proposed", color: "border-muted-foreground/30" },
  { id: "approved", title: "Approved", color: "border-pillar-business/30" },
  { id: "queued", title: "Queued", color: "border-status-warning/30" },
  { id: "in_progress", title: "In Progress", color: "border-pillar-development/30" },
  { id: "done", title: "Done", color: "border-status-healthy/30" },
];

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-secondary text-muted-foreground",
  medium: "bg-status-warning/10 text-status-warning",
  high: "bg-status-warning/10 text-status-warning",
  critical: "bg-status-critical/10 text-status-critical",
};

export function FeaturesTab({ productId }: FeaturesTabProps) {
  const { data: specFeatures, isLoading } = useSpecificationFeatures(productId);
  const updateFeature = useUpdateSpecFeature(productId);
  const queueFeature = useQueueFeature(productId);
  const unqueueFeature = useUnqueueFeature(productId);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reusableOpen, setReusableOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<SpecificationFeature | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const rawFeatures = specFeatures ?? [];

  const featuresByColumn = useMemo(() => {
    const map: Record<FeatureStatus, SpecificationFeature[]> = {
      proposed: [],
      approved: [],
      queued: [],
      in_progress: [],
      done: [],
    };
    for (const f of rawFeatures) {
      const status = (f.status as FeatureStatus) || "proposed";
      if (map[status]) map[status].push(f);
      else map.proposed.push(f);
    }
    return map;
  }, [rawFeatures]);

  const activeFeature = activeId
    ? rawFeatures.find((f) => f.id === activeId) ?? null
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const featureId = active.id as string;
      const feature = rawFeatures.find((f) => f.id === featureId);
      if (!feature) return;

      const overId = over.id as string;
      const targetColumn = COLUMNS.find((c) => c.id === overId);
      const currentStatus = (feature.status as FeatureStatus) || "proposed";

      if (!targetColumn || currentStatus === targetColumn.id) return;

      if (targetColumn.id === "queued" && currentStatus !== "queued") {
        queueFeature.mutate(featureId);
      } else if (currentStatus === "queued" && targetColumn.id !== "queued") {
        unqueueFeature.mutate(featureId);
        updateFeature.mutate({ id: featureId, status: targetColumn.id });
      } else {
        updateFeature.mutate({ id: featureId, status: targetColumn.id });
      }
    },
    [rawFeatures, updateFeature, queueFeature, unqueueFeature],
  );

  const handleFeatureClick = useCallback(
    (feature: SpecificationFeature) => {
      setSelectedFeature(feature);
      setEditOpen(true);
    },
    [],
  );

  const handleMarkReusable = useCallback(
    (feature: SpecificationFeature) => {
      setSelectedFeature(feature);
      setReusableOpen(true);
    },
    [],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Feature Board</h2>
          <p className="text-sm text-muted-foreground">
            Drag features between columns to update their status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Library className="h-4 w-4 mr-1" /> Import from Library
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Feature
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-3 min-h-[400px]">
          {COLUMNS.map((col) => (
            <FeatureBoardColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              features={featuresByColumn[col.id]}
              onFeatureClick={handleFeatureClick}
              onMarkReusable={handleMarkReusable}
            />
          ))}
        </div>
        <DragOverlay>
          {activeFeature && (
            <DragOverlayCard feature={activeFeature} />
          )}
        </DragOverlay>
      </DndContext>

      {rawFeatures.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="font-medium">No features yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add features manually or generate them from the specification
            </p>
          </CardContent>
        </Card>
      )}

      <AddFeatureDialog open={addOpen} onOpenChange={setAddOpen} productId={productId} />
      <EditFeatureDialog open={editOpen} onOpenChange={setEditOpen} feature={selectedFeature} productId={productId} />
      <ImportFromLibraryDialog open={importOpen} onOpenChange={setImportOpen} productId={productId} />
      <MarkReusableDialog open={reusableOpen} onOpenChange={setReusableOpen} feature={selectedFeature} productId={productId} />
    </div>
  );
}

function DragOverlayCard({ feature }: { feature: SpecificationFeature }) {
  return (
    <Card className="shadow-lg rotate-2 w-[200px]">
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate">{feature.name}</p>
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
        </div>
      </CardContent>
    </Card>
  );
}
