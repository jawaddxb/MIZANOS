"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, Search } from "lucide-react";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { useTaskTemplates, useReorderTaskTemplates } from "@/hooks/queries/useTaskTemplates";
import { useTaskTemplateGroupDetail } from "@/hooks/queries/useTaskTemplateGroups";
import { SortableTemplateRow } from "./SortableTemplateRow";
import type { TaskTemplate } from "@/lib/types";

interface TemplateListProps {
  sourceType?: string;
  groupId?: string;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (template: TaskTemplate) => void;
  onToggleActive: (template: TaskTemplate, active: boolean) => void;
  onAdd: () => void;
}

export function TemplateList({
  sourceType,
  groupId,
  onEdit,
  onDelete,
  onToggleActive,
  onAdd,
}: TemplateListProps) {
  // Fetch from group detail when groupId is provided, else flat list
  const flatQuery = useTaskTemplates(groupId ? null : sourceType);
  const groupQuery = useTaskTemplateGroupDetail(groupId ?? null);

  const templates = groupId
    ? groupQuery.data?.items ?? []
    : flatQuery.data ?? [];
  const isLoading = groupId ? groupQuery.isLoading : flatQuery.isLoading;

  const reorder = useReorderTaskTemplates();
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const filtered = useMemo(() => {
    if (!search) return templates;
    const q = search.toLowerCase();
    return templates.filter((t) => t.title.toLowerCase().includes(q));
  }, [templates, search]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIdx = filtered.findIndex((t) => t.id === active.id);
      const newIdx = filtered.findIndex((t) => t.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(filtered, oldIdx, newIdx);
      const effectiveSourceType = sourceType ?? reordered[0]?.source_type;
      if (!effectiveSourceType) return;

      reorder.mutate({
        sourceType: effectiveSourceType,
        orderedIds: reordered.map((t) => t.id),
      });
    },
    [filtered, sourceType, reorder],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <BaseInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
        {!groupId && (
          <BaseButton onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Template
          </BaseButton>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search
              ? "No templates match your search."
              : "No steps yet. Add one to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                  <th className="w-10 px-2 py-2" />
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Pillar</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Active</th>
                  <th className="px-3 py-2 w-24">Actions</th>
                </tr>
              </thead>
              <SortableContext
                items={filtered.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {filtered.map((template) => (
                    <SortableTemplateRow
                      key={template.id}
                      template={template}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleActive={onToggleActive}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      )}
    </div>
  );
}
