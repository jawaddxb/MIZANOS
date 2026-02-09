"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Separator } from "@/components/atoms/layout/Separator";
import { Button } from "@/components/molecules/buttons/Button";
import { AutosaveIndicator } from "@/components/molecules/feedback/AutosaveIndicator";
import { useLatestSpecification } from "@/hooks/queries/useSpecifications";
import { useSpecificationFeatures } from "@/hooks/queries/useSpecifications";
import {
  useUpdateSpecFeature,
  useCreateSpecFeature,
  useDeleteSpecFeature,
} from "@/hooks/mutations/useSpecificationMutations";
import { useAutosave } from "@/hooks/utils/useAutosave";
import type { SpecificationFeature, JsonValue } from "@/lib/types";
import {
  Plus,
  Trash2,
  GripVertical,
  FileText,
  CheckCircle2,
  Circle,
  XCircle,
} from "lucide-react";

interface SpecEditorProps {
  productId: string;
}

interface FeatureRowProps {
  feature: SpecificationFeature;
  onUpdate: (id: string, data: Partial<SpecificationFeature>) => void;
  onDelete: (id: string) => void;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", icon: Circle, color: "text-muted-foreground" },
  { value: "in_progress", label: "In Progress", icon: Circle, color: "text-yellow-600" },
  { value: "completed", label: "Completed", icon: CheckCircle2, color: "text-green-600" },
  { value: "deferred", label: "Deferred", icon: XCircle, color: "text-orange-600" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

function FeatureRow({ feature, onUpdate, onDelete }: FeatureRowProps) {
  const [name, setName] = useState(feature.name);
  const [description, setDescription] = useState(feature.description ?? "");

  const handleSave = useCallback(
    async (data: { name: string; description: string }): Promise<void> => {
      onUpdate(feature.id, {
        name: data.name,
        description: data.description || null,
      });
    },
    [feature.id, onUpdate],
  );

  const { status: autosaveStatus } = useAutosave({
    data: { name, description },
    onSave: handleSave,
    delay: 1500,
    enabled: name !== feature.name || description !== (feature.description ?? ""),
  });

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === feature.status);
  const StatusIcon = currentStatus?.icon ?? Circle;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
      <GripVertical className="h-5 w-5 text-muted-foreground/50 mt-1 cursor-grab shrink-0" />

      <div className="flex-1 min-w-0 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0"
          placeholder="Feature name..."
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-xs text-muted-foreground bg-transparent border-none outline-none resize-none focus:ring-0 p-0"
          placeholder="Description..."
          rows={1}
        />
        <div className="flex items-center gap-2">
          <select
            value={feature.status}
            onChange={(e) => onUpdate(feature.id, { status: e.target.value })}
            className="text-xs border rounded px-1.5 py-0.5 bg-background"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={feature.priority}
            onChange={(e) => onUpdate(feature.id, { priority: e.target.value })}
            className="text-xs border rounded px-1.5 py-0.5 bg-background"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <AutosaveIndicator status={autosaveStatus} className="ml-auto" />
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <StatusIcon className={`h-4 w-4 ${currentStatus?.color ?? ""}`} />
        <button
          onClick={() => onDelete(feature.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
    </div>
  );
}

function SpecEditor({ productId }: SpecEditorProps) {
  const { data: specification } = useLatestSpecification(productId);
  const { data: features, isLoading } = useSpecificationFeatures(productId);
  const createFeature = useCreateSpecFeature(productId);
  const updateFeature = useUpdateSpecFeature(productId);
  const deleteFeature = useDeleteSpecFeature(productId);

  const handleUpdate = useCallback(
    (id: string, data: Partial<SpecificationFeature>) => {
      updateFeature.mutate({ id, ...data });
    },
    [updateFeature],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteFeature.mutate(id);
    },
    [deleteFeature],
  );

  const handleAddFeature = () => {
    createFeature.mutate({
      name: "New Feature",
      status: "pending",
      priority: "medium",
      sort_order: (features?.length ?? 0) + 1,
      specification_id: specification?.id ?? null,
    });
  };

  if (!specification) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Generate a specification first to manage features.
          </p>
        </CardContent>
      </Card>
    );
  }

  const featuresByStatus = {
    pending: features?.filter((f) => f.status === "pending") ?? [],
    in_progress: features?.filter((f) => f.status === "in_progress") ?? [],
    completed: features?.filter((f) => f.status === "completed") ?? [],
    deferred: features?.filter((f) => f.status === "deferred") ?? [],
  };

  const totalFeatures = features?.length ?? 0;
  const completedCount = featuresByStatus.completed.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Feature Editor</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{totalFeatures} features completed
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleAddFeature}
          loading={createFeature.isPending}
          size="sm"
        >
          Add Feature
        </Button>
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : totalFeatures === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No features added yet.
            </p>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleAddFeature}
              variant="outline"
              size="sm"
            >
              Add Your First Feature
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {features
            ?.sort((a, b) => a.sort_order - b.sort_order)
            .map((feature) => (
              <FeatureRow
                key={feature.id}
                feature={feature}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export { SpecEditor };
export type { SpecEditorProps };
