"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { Button } from "@/components/molecules/buttons/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";
import { useProductMembers } from "@/hooks/queries/useProductMembers";
import { useBulkAssignTasks } from "@/hooks/mutations/useTaskMutations";

interface BulkAssignToolbarProps {
  taskCount: number;
  selectedIds: Set<string>;
  onToggleAll: () => void;
  onClearSelection: () => void;
  productId: string;
}

const UNASSIGNED_VALUE = "__unassigned__";

export function BulkAssignToolbar({
  taskCount,
  selectedIds,
  onToggleAll,
  onClearSelection,
  productId,
}: BulkAssignToolbarProps) {
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const { data: members = [] } = useProductMembers(productId);
  const bulkAssign = useBulkAssignTasks(productId);

  const allSelected = taskCount > 0 && selectedIds.size === taskCount;
  const hasSelection = selectedIds.size > 0;

  const handleAssign = () => {
    if (!selectedAssignee || !hasSelection) return;

    const assigneeId = selectedAssignee === UNASSIGNED_VALUE ? null : selectedAssignee;
    bulkAssign.mutate(
      { taskIds: [...selectedIds], assigneeId },
      {
        onSuccess: () => {
          onClearSelection();
          setSelectedAssignee("");
        },
      },
    );
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3">
      <div className="flex items-center gap-3">
        <BaseCheckbox checked={allSelected} onCheckedChange={onToggleAll} />
        <span className="text-sm text-muted-foreground">
          {hasSelection
            ? `${selectedIds.size} of ${taskCount} selected`
            : `${taskCount} task${taskCount !== 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
          <SelectTrigger className="w-[180px] h-8 text-xs" disabled={!hasSelection}>
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.profile_id} value={member.profile_id}>
                {member.profile?.full_name ?? member.profile?.email ?? "Unknown"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAssign}
          disabled={!hasSelection || !selectedAssignee || bulkAssign.isPending}
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Assign ({selectedIds.size})
        </Button>
      </div>
    </div>
  );
}
