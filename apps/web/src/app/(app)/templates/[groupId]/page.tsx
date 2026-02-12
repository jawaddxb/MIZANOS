"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Pencil, Plus } from "lucide-react";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { TemplateList } from "@/components/organisms/templates/TemplateList";
import { TaskTemplateEditor } from "@/components/organisms/settings/TaskTemplateEditor";
import { DeleteTemplateDialog } from "@/components/organisms/templates/DeleteTemplateDialog";
import { TemplateGroupEditor } from "@/components/organisms/templates/TemplateGroupEditor";
import { useTaskTemplateGroupDetail, useUpdateTaskTemplateGroup } from "@/hooks/queries/useTaskTemplateGroups";
import {
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeleteTaskTemplate,
} from "@/hooks/queries/useTaskTemplates";
import type { TaskTemplate, TaskTemplateGroup } from "@/lib/types";

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;

  const { data: group, isLoading } = useTaskTemplateGroupDetail(groupId);
  const updateGroup = useUpdateTaskTemplateGroup();

  const createTemplate = useCreateTaskTemplate();
  const updateTemplate = useUpdateTaskTemplate();
  const deleteTemplate = useDeleteTaskTemplate();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<TaskTemplate | null>(null);
  const [groupEditorOpen, setGroupEditorOpen] = useState(false);

  const handleAddStep = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const handleEditStep = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleSaveStep = (data: Partial<TaskTemplate>) => {
    const payload = { ...data, group_id: groupId, source_type: group?.source_type };
    if (editingTemplate) {
      updateTemplate.mutate(
        { id: editingTemplate.id, data: payload },
        { onSuccess: () => setEditorOpen(false) },
      );
    } else {
      createTemplate.mutate(payload, {
        onSuccess: () => setEditorOpen(false),
      });
    }
  };

  const handleToggleActive = (template: TaskTemplate, active: boolean) => {
    updateTemplate.mutate({ id: template.id, data: { is_active: active } });
  };

  const handleDeleteConfirm = () => {
    if (!deletingTemplate) return;
    deleteTemplate.mutate(deletingTemplate.id, {
      onSuccess: () => setDeletingTemplate(null),
    });
  };

  const handleSaveGroup = (data: Partial<TaskTemplateGroup>) => {
    updateGroup.mutate(
      { id: groupId, data },
      { onSuccess: () => setGroupEditorOpen(false) },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-muted-foreground">Group not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/templates" className="hover:text-foreground transition-colors">
          Templates
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{group.name}</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {group.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <BaseButton
            variant="outline"
            size="sm"
            onClick={() => setGroupEditorOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit Group
          </BaseButton>
          <BaseButton size="sm" onClick={handleAddStep}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Step
          </BaseButton>
        </div>
      </div>

      <TemplateList
        groupId={groupId}
        onEdit={handleEditStep}
        onDelete={setDeletingTemplate}
        onToggleActive={handleToggleActive}
        onAdd={handleAddStep}
      />

      <TaskTemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        onSave={handleSaveStep}
        isSaving={createTemplate.isPending || updateTemplate.isPending}
        groupId={groupId}
      />

      <DeleteTemplateDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
        templateTitle={deletingTemplate?.title ?? ""}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteTemplate.isPending}
      />

      <TemplateGroupEditor
        open={groupEditorOpen}
        onOpenChange={setGroupEditorOpen}
        group={group}
        onSave={handleSaveGroup}
        isSaving={updateGroup.isPending}
      />
    </div>
  );
}
