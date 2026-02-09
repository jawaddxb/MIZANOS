"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { PillarBadge } from "@/components/molecules/indicators/PillarBadge";
import type { TaskTemplate } from "@/lib/types";
import {
  useTaskTemplates,
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeleteTaskTemplate,
} from "@/hooks/queries/useTaskTemplates";
import { TaskTemplateEditor } from "./TaskTemplateEditor";

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: TaskTemplate;
  onEdit: (t: TaskTemplate) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-3 border rounded-lg hover:border-primary/50 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm text-foreground">
              {template.title}
            </h4>
            <PillarBadge pillar={template.pillar} />
            {template.priority && (
              <Badge variant="outline" className="text-xs">
                {template.priority}
              </Badge>
            )}
            {template.is_active === false && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(template)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(template.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SourceTypeGroup({
  sourceType,
  templates,
  onEdit,
  onDelete,
}: {
  sourceType: string;
  templates: TaskTemplate[];
  onEdit: (t: TaskTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const label = sourceType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="font-medium text-sm">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {templates.length}
          </Badge>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkflowRulesTab() {
  const { data: templates = [], isLoading } = useTaskTemplates();
  const createTemplate = useCreateTaskTemplate();
  const updateTemplate = useUpdateTaskTemplate();
  const deleteTemplate = useDeleteTaskTemplate();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, TaskTemplate[]> = {};
    templates.forEach((t) => {
      const key = t.source_type;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [templates]);

  const sourceTypes = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const handleEdit = useCallback((t: TaskTemplate) => {
    setEditing(t);
    setEditorOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteTemplate.mutate(id);
    },
    [deleteTemplate],
  );

  const handleSave = useCallback(
    (data: Partial<TaskTemplate>) => {
      if (editing) {
        updateTemplate.mutate(
          { id: editing.id, data },
          { onSuccess: () => setEditorOpen(false) },
        );
      } else {
        createTemplate.mutate(data, {
          onSuccess: () => setEditorOpen(false),
        });
      }
    },
    [editing, updateTemplate, createTemplate],
  );

  const handleCreate = useCallback(() => {
    setEditing(null);
    setEditorOpen(true);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Workflow Rules</h3>
            <p className="text-sm text-muted-foreground">
              Task templates grouped by project source type
            </p>
          </div>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add Template
          </Button>
        </div>

        {sourceTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No task templates configured yet.
          </p>
        ) : (
          <div className="space-y-3">
            {sourceTypes.map((st) => (
              <SourceTypeGroup
                key={st}
                sourceType={st}
                templates={grouped[st]}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <TaskTemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editing}
        onSave={handleSave}
        isSaving={createTemplate.isPending || updateTemplate.isPending}
      />
    </Card>
  );
}
