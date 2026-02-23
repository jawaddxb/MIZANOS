"use client";

import { useState } from "react";
import { LayoutGrid, List, Sparkles, FileText, LayoutTemplate, Loader2, ClipboardCheck, Mail, MailX, Trash2 } from "lucide-react";
import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import { Button } from "@/components/molecules/buttons/Button";
import { Badge } from "@/components/atoms/display/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/layout/DropdownMenu";
import { KanbanBoard } from "@/components/organisms/kanban/KanbanBoard";
import { TasksTab } from "@/components/organisms/product/TasksTab";
import { DraftTaskReview } from "@/components/organisms/product/DraftTaskReview";
import { ConfirmActionDialog } from "@/components/molecules/feedback/ConfirmActionDialog";
import {
  useGenerateTasksFromSpec,
  useGenerateTasksFromTemplates,
} from "@/hooks/mutations/useTaskGenerationMutations";
import { useGeneratePortTasks } from "@/hooks/mutations/usePortGenerator";
import { useDeleteAllDrafts } from "@/hooks/mutations/useTaskApprovalMutations";
import { useProductDetail } from "@/hooks/queries/useProductDetail";
import { useDraftTasks } from "@/hooks/queries/useDraftTasks";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";
import { useProductNotificationSettings } from "@/hooks/queries/useProductNotificationSettings";
import { useUpdateProductNotificationSettings } from "@/hooks/mutations/useProductNotificationSettingsMutations";

type ViewMode = "board" | "list" | "drafts";
type GenerateSource = "spec" | "templates" | "port";

interface TasksViewToggleProps {
  productId: string;
  openTaskId?: string;
}

export function TasksViewToggle({ productId, openTaskId }: TasksViewToggleProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const { data: productData } = useProductDetail(productId);
  const { data: drafts = [] } = useDraftTasks(productId);
  const { isAdmin, isProjectManager } = useRoleVisibility();
  const generateFromSpec = useGenerateTasksFromSpec(productId);
  const generateFromTemplates = useGenerateTasksFromTemplates(productId);
  const generateFromPort = useGeneratePortTasks(productId);
  const deleteAllDrafts = useDeleteAllDrafts(productId);

  const { data: notifSettings } = useProductNotificationSettings(productId);
  const updateNotifSettings = useUpdateProductNotificationSettings(productId);

  const isGenerating =
    generateFromSpec.isPending ||
    generateFromTemplates.isPending ||
    generateFromPort.isPending;

  const showLovable = productData?.product?.source_type?.includes("lovable");
  const showDraftsTab = isAdmin || isProjectManager;
  const draftCount = drafts.length;

  const fireGenerate = (source: GenerateSource) => {
    if (source === "spec") generateFromSpec.mutate();
    else if (source === "templates") generateFromTemplates.mutate();
    else generateFromPort.mutate(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={view === "board" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("board")}
            className="h-8 px-3"
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Board
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="h-8 px-3"
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          {showDraftsTab && (
            <Button
              variant={view === "drafts" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("drafts")}
              className="h-8 px-3"
            >
              <ClipboardCheck className="h-4 w-4 mr-1" />
              Drafts
              {draftCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
                  {draftCount}
                </Badge>
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {view !== "drafts" && (isAdmin || isProjectManager) && (
            <div className="flex flex-col items-end gap-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                {notifSettings?.email_enabled !== false ? (
                  <Mail className="h-4 w-4 text-primary" />
                ) : (
                  <MailX className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium whitespace-nowrap">
                  Email Alerts
                </span>
                <BaseSwitch
                  checked={notifSettings?.email_enabled !== false}
                  onCheckedChange={(checked) => updateNotifSettings.mutate(checked)}
                  disabled={updateNotifSettings.isPending}
                />
              </label>
              <span className="text-[11px] text-muted-foreground">
                Notify members via email on task assignments
              </span>
            </div>
          )}

        {(isAdmin || isProjectManager) && (
          draftCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscardConfirm(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Discard Drafts
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  Generate Tasks
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => fireGenerate("spec")}>
                  <FileText className="h-4 w-4 mr-2" />
                  From Specification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fireGenerate("templates")}>
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  From Templates
                </DropdownMenuItem>
                {showLovable && (
                  <DropdownMenuItem onClick={() => fireGenerate("port")}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    From Lovable Manifest
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}
        </div>
      </div>

      {view === "board" && <KanbanBoard productId={productId} />}
      {view === "list" && <TasksTab productId={productId} openTaskId={openTaskId} />}
      {view === "drafts" && (
        <DraftTaskReview
          productId={productId}
          onGenerateFromSpec={() => fireGenerate("spec")}
          onGenerateFromTemplates={() => fireGenerate("templates")}
          onGenerateFromPort={() => fireGenerate("port")}
          isGenerating={isGenerating}
          showLovable={!!showLovable}
        />
      )}

      <ConfirmActionDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title="Discard all draft tasks?"
        description={`This will permanently delete ${draftCount} draft task${draftCount !== 1 ? "s" : ""}. This action cannot be undone.`}
        confirmLabel="Discard All"
        variant="destructive"
        onConfirm={() => deleteAllDrafts.mutate(undefined, { onSuccess: () => setShowDiscardConfirm(false) })}
        isPending={deleteAllDrafts.isPending}
      />
    </div>
  );
}
