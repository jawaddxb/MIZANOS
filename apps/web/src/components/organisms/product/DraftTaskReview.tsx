"use client";

import { useState } from "react";
import { Check, X, FileText, LayoutTemplate, Sparkles } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { useDraftTasks } from "@/hooks/queries/useDraftTasks";
import {
  useApproveTask,
  useBulkApproveTasks,
  useRejectTask,
  useBulkRejectTasks,
} from "@/hooks/mutations/useTaskApprovalMutations";

interface DraftTaskReviewProps {
  productId: string;
}

const SOURCE_CONFIG: Record<string, { label: string; icon: typeof FileText }> = {
  specification: { label: "Spec", icon: FileText },
  template: { label: "Template", icon: LayoutTemplate },
  lovable_port: { label: "Lovable", icon: Sparkles },
};

export function DraftTaskReview({ productId }: DraftTaskReviewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: drafts = [], isLoading } = useDraftTasks(productId);

  const approveTask = useApproveTask(productId);
  const bulkApprove = useBulkApproveTasks(productId);
  const rejectTask = useRejectTask(productId);
  const bulkReject = useBulkRejectTasks(productId);

  const allSelected = drafts.length > 0 && selectedIds.size === drafts.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drafts.map((t) => t.id)));
    }
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
    bulkApprove.mutate([...selectedIds], {
      onSuccess: () => setSelectedIds(new Set()),
    });
  };

  const handleBulkReject = () => {
    bulkReject.mutate([...selectedIds], {
      onSuccess: () => setSelectedIds(new Set()),
    });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading drafts...</div>;
  }

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No draft tasks to review</p>
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
          />
        ))}
      </div>
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
}

function DraftToolbar({
  draftCount,
  selectedCount,
  allSelected,
  onToggleAll,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
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
          disabled={selectedCount === 0 || isApproving}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <Check className="h-4 w-4 mr-1" />
          Approve ({selectedCount})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReject}
          disabled={selectedCount === 0 || isRejecting}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Reject ({selectedCount})
        </Button>
      </div>
    </div>
  );
}

interface DraftRowProps {
  task: { id: string; title: string; description: string | null; generation_source: string | null; pillar: string | null; priority: string | null };
  selected: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function DraftRow({ task, selected, onToggle, onApprove, onReject }: DraftRowProps) {
  const source = SOURCE_CONFIG[task.generation_source ?? ""] ?? null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
      <BaseCheckbox checked={selected} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {task.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {source && (
          <Badge variant="secondary" className="text-xs">
            <source.icon className="h-3 w-3 mr-1" />
            {source.label}
          </Badge>
        )}
        {task.pillar && (
          <Badge variant="outline" className="text-xs capitalize">
            {task.pillar}
          </Badge>
        )}
        {task.priority && (
          <Badge variant="outline" className="text-xs capitalize">
            {task.priority}
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={onApprove}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={onReject}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
