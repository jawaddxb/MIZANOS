"use client";

import { useState } from "react";
import { Check, X, FileText, LayoutTemplate, Sparkles, Loader2 } from "lucide-react";
import { DraftRow, type DraftTask } from "./DraftRow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/layout/DropdownMenu";
import { Button } from "@/components/molecules/buttons/Button";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { useDraftTasks } from "@/hooks/queries/useDraftTasks";
import {
  useApproveTask,
  useBulkApproveTasks,
  useRejectDraftTask,
  useBulkRejectDraftTasks,
} from "@/hooks/mutations/useTaskApprovalMutations";
import { useProductDetail } from "@/hooks/queries/useProductDetail";
import { DraftDetailDialog } from "./DraftDetailDialog";

interface DraftTaskReviewProps {
  productId: string;
  onGenerateFromSpec?: () => void;
  onGenerateFromTemplates?: () => void;
  onGenerateFromPort?: () => void;
  isGenerating?: boolean;
  showLovable?: boolean;
}

export function DraftTaskReview({
  productId, onGenerateFromSpec, onGenerateFromTemplates, onGenerateFromPort,
  isGenerating, showLovable,
}: DraftTaskReviewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewTask, setViewTask] = useState<DraftTask | null>(null);
  const { data: drafts = [], isLoading } = useDraftTasks(productId);
  const { data: productData } = useProductDetail(productId);
  const tasksLocked = productData?.product?.tasks_locked ?? false;
  const approveTask = useApproveTask(productId);
  const bulkApprove = useBulkApproveTasks(productId);
  const rejectTask = useRejectDraftTask(productId);
  const bulkReject = useBulkRejectDraftTasks(productId);

  const allSelected = drafts.length > 0 && selectedIds.size === drafts.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(drafts.map((t) => t.id)));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApprove = () => {
    bulkApprove.mutate([...selectedIds], { onSuccess: () => setSelectedIds(new Set()) });
  };

  const handleBulkReject = () => {
    bulkReject.mutate([...selectedIds], { onSuccess: () => setSelectedIds(new Set()) });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading drafts...</div>;
  }

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No draft tasks to review</p>
        <p className="text-xs mt-1 max-w-sm text-center">
          Generate tasks from your specification, templates, or a Lovable manifest. They will appear here as drafts for review.
        </p>
        {onGenerateFromSpec && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="mt-4" disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Generate Tasks
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={onGenerateFromSpec}>
                <FileText className="h-4 w-4 mr-2" />
                From Specification
              </DropdownMenuItem>
              {onGenerateFromTemplates && (
                <DropdownMenuItem onClick={onGenerateFromTemplates}>
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  From Templates
                </DropdownMenuItem>
              )}
              {showLovable && onGenerateFromPort && (
                <DropdownMenuItem onClick={onGenerateFromPort}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  From Lovable Manifest
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DraftToolbar
        draftCount={drafts.length}
        selectedCount={selectedIds.size}
        allSelected={allSelected}
        onToggleAll={toggleSelectAll}
        onApprove={handleBulkApprove}
        onReject={handleBulkReject}
        isApproving={bulkApprove.isPending}
        isRejecting={bulkReject.isPending}
        tasksLocked={tasksLocked}
      />
      <div className="border rounded-lg divide-y">
        {drafts.map((task) => (
          <DraftRow
            key={task.id}
            task={task}
            selected={selectedIds.has(task.id)}
            onToggle={() => toggleSelect(task.id)}
            onApprove={() => approveTask.mutate(task.id)}
            onReject={() => rejectTask.mutate(task.id)}
            onViewDetail={() => setViewTask(task)}
            tasksLocked={tasksLocked}
          />
        ))}
      </div>
      <DraftDetailDialog
        task={viewTask}
        open={viewTask !== null}
        onOpenChange={(open) => { if (!open) setViewTask(null); }}
      />
    </div>
  );
}

interface DraftToolbarProps {
  draftCount: number;
  selectedCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
  tasksLocked: boolean;
}

function DraftToolbar({
  draftCount, selectedCount, allSelected,
  onToggleAll, onApprove, onReject,
  isApproving, isRejecting, tasksLocked,
}: DraftToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <BaseCheckbox checked={allSelected} onCheckedChange={onToggleAll} />
        <span className="text-sm text-muted-foreground">
          {draftCount} draft task{draftCount !== 1 ? "s" : ""} awaiting review
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onApprove}
          disabled={selectedCount === 0 || isApproving || !tasksLocked}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <Check className="h-4 w-4 mr-1" />
          Approve ({selectedCount})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReject}
          disabled={selectedCount === 0 || isRejecting || !tasksLocked}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Reject ({selectedCount})
        </Button>
      </div>
    </div>
  );
}

