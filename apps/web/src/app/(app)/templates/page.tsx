"use client";

import { useState } from "react";
import { LayoutTemplate, Plus } from "lucide-react";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { PageHeader } from "@/components/molecules/layout/PageHeader";
import { TemplateGroupList } from "@/components/organisms/templates/TemplateGroupList";
import { TemplateGroupEditor } from "@/components/organisms/templates/TemplateGroupEditor";
import { DeleteTemplateDialog } from "@/components/organisms/templates/DeleteTemplateDialog";
import {
  useCreateTaskTemplateGroup,
  useUpdateTaskTemplateGroup,
  useDeleteTaskTemplateGroup,
} from "@/hooks/queries/useTaskTemplateGroups";
import type { TaskTemplateGroup } from "@/lib/types";

const SOURCE_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "greenfield", label: "Greenfield" },
  { id: "lovable_port", label: "Lovable Port" },
  { id: "replit_port", label: "Replit Port" },
  { id: "github_unscaffolded", label: "GitHub" },
  { id: "external_handoff", label: "External" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_progress_standards", label: "Standards" },
  { id: "in_progress_legacy", label: "Legacy" },
];

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TaskTemplateGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<TaskTemplateGroup | null>(null);

  const createGroup = useCreateTaskTemplateGroup();
  const updateGroup = useUpdateTaskTemplateGroup();
  const deleteGroup = useDeleteTaskTemplateGroup();

  const handleAdd = () => {
    setEditingGroup(null);
    setEditorOpen(true);
  };

  const handleEdit = (group: TaskTemplateGroup) => {
    setEditingGroup(group);
    setEditorOpen(true);
  };

  const handleSave = (data: Partial<TaskTemplateGroup>) => {
    if (editingGroup) {
      updateGroup.mutate(
        { id: editingGroup.id, data },
        { onSuccess: () => setEditorOpen(false) },
      );
    } else {
      createGroup.mutate(data, {
        onSuccess: () => setEditorOpen(false),
      });
    }
  };

  const handleToggleActive = (group: TaskTemplateGroup, active: boolean) => {
    updateGroup.mutate({ id: group.id, data: { is_active: active } });
  };

  const handleDeleteConfirm = () => {
    if (!deletingGroup) return;
    deleteGroup.mutate(deletingGroup.id, {
      onSuccess: () => setDeletingGroup(null),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Workflow Templates"
        subtitle="Multi-step workflow templates for each project source type"
        icon={<LayoutTemplate className="h-5 w-5 text-primary" />}
      >
        <BaseButton onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Template
        </BaseButton>
      </PageHeader>

      <div className="flex gap-1 border-b overflow-x-auto">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TemplateGroupList
        sourceType={activeTab === "all" ? undefined : activeTab}
        onEdit={handleEdit}
        onDelete={setDeletingGroup}
        onToggleActive={handleToggleActive}
      />

      <TemplateGroupEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        group={editingGroup}
        onSave={handleSave}
        isSaving={createGroup.isPending || updateGroup.isPending}
      />

      <DeleteTemplateDialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
        templateTitle={deletingGroup?.name ?? ""}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteGroup.isPending}
      />
    </div>
  );
}
