"use client";

import { useState } from "react";
import { UserPlus, Calendar, ArrowUpDown } from "lucide-react";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { Button } from "@/components/molecules/buttons/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";
import { useProductMembers } from "@/hooks/queries/useProductMembers";
import { useBulkUpdateTasks } from "@/hooks/mutations/useTaskMutations";

interface BulkActionsToolbarProps {
  taskCount: number;
  selectedIds: Set<string>;
  onToggleAll: () => void;
  onClearSelection: () => void;
  productId: string;
}

type ActiveAction = "assign" | "dueDate" | "priority" | null;
const UNASSIGNED_VALUE = "__unassigned__";

export function BulkActionsToolbar({
  taskCount,
  selectedIds,
  onToggleAll,
  onClearSelection,
  productId,
}: BulkActionsToolbarProps) {
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const { data: members = [] } = useProductMembers(productId);
  const bulkUpdate = useBulkUpdateTasks(productId);

  const allSelected = taskCount > 0 && selectedIds.size === taskCount;
  const hasSelection = selectedIds.size > 0;

  const handleApply = () => {
    if (!hasSelection) return;
    const taskIds = [...selectedIds];

    if (activeAction === "assign" && selectedAssignee) {
      const assigneeId = selectedAssignee === UNASSIGNED_VALUE ? null : selectedAssignee;
      bulkUpdate.mutate(
        { taskIds, updates: { assignee_id: assigneeId } },
        { onSuccess: resetState },
      );
    } else if (activeAction === "dueDate" && selectedDate) {
      bulkUpdate.mutate(
        { taskIds, updates: { due_date: selectedDate } },
        { onSuccess: resetState },
      );
    } else if (activeAction === "priority" && selectedPriority) {
      bulkUpdate.mutate(
        { taskIds, updates: { priority: selectedPriority } },
        { onSuccess: resetState },
      );
    }
  };

  const resetState = () => {
    onClearSelection();
    setActiveAction(null);
    setSelectedAssignee("");
    setSelectedDate("");
    setSelectedPriority("");
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <BaseCheckbox checked={allSelected} onCheckedChange={onToggleAll} />
      <span className="text-sm font-medium">
        {hasSelection
          ? `${selectedIds.size} of ${taskCount} selected`
          : `${taskCount} task${taskCount !== 1 ? "s" : ""}`}
      </span>

      <span className="text-xs text-muted-foreground border-l pl-3 ml-1">Bulk Actions:</span>
      <div className="flex items-center gap-2">
        <Button
          variant={activeAction === "assign" ? "default" : "outline"}
          size="sm"
          disabled={!hasSelection}
          onClick={() => setActiveAction(activeAction === "assign" ? null : "assign")}
          className="h-8"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Assign
        </Button>
        <Button
          variant={activeAction === "dueDate" ? "default" : "outline"}
          size="sm"
          disabled={!hasSelection}
          onClick={() => setActiveAction(activeAction === "dueDate" ? null : "dueDate")}
          className="h-8"
        >
          <Calendar className="h-4 w-4 mr-1.5" />
          Due Date
        </Button>
        <Button
          variant={activeAction === "priority" ? "default" : "outline"}
          size="sm"
          disabled={!hasSelection}
          onClick={() => setActiveAction(activeAction === "priority" ? null : "priority")}
          className="h-8"
        >
          <ArrowUpDown className="h-4 w-4 mr-1.5" />
          Priority
        </Button>
      </div>

      {activeAction === "assign" && (
        <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.profile_id} value={m.profile_id}>
                {m.profile?.full_name ?? m.profile?.email ?? "Unknown"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {activeAction === "dueDate" && (
        <BaseInput
          type="date"
          value={selectedDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
          className="h-8 w-[160px] text-sm"
        />
      )}

      {activeAction === "priority" && (
        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      )}

      {activeAction && (
        <Button
          variant="default"
          size="sm"
          onClick={handleApply}
          disabled={bulkUpdate.isPending}
          className="h-8 font-semibold"
        >
          Apply ({selectedIds.size})
        </Button>
      )}
    </div>
  );
}
