"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { BulkAssignToolbar } from "@/components/molecules/tasks/BulkAssignToolbar";
import { ClaudeCodePrompt } from "@/components/molecules/tasks/ClaudeCodePrompt";
import { EditTaskDialog } from "@/components/organisms/product/EditTaskDialog";
import { AddTaskDialog } from "@/components/organisms/kanban/AddTaskDialog";
import { toKanbanTask } from "@/components/organisms/kanban/kanban-utils";
import { useTasks } from "@/hooks/queries/useTasks";
import { useProductMembers } from "@/hooks/queries/useProductMembers";
import { useCreateTask } from "@/hooks/mutations/useTaskMutations";
import { TASK_STATUS_DISPLAY, TASK_PRIORITY_COLORS } from "@/lib/constants";
import type { Task, KanbanTask, TaskStatus, TaskPriority } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/inputs/BaseSelect";
import { Filter, ListTodo, Plus, User } from "lucide-react";

interface TasksTabProps { productId: string }
type FilterStatus = TaskStatus | "all";
type FilterPriority = TaskPriority | "all";

interface TaskRowProps {
  task: Task;
  selected: boolean;
  assigneeName?: string;
  onToggle: () => void;
  onClick: () => void;
}

function TaskRow({ task, selected, assigneeName, onToggle, onClick }: TaskRowProps) {
  const statusConfig = TASK_STATUS_DISPLAY[task.status ?? "backlog"] ?? TASK_STATUS_DISPLAY.backlog;
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 p-3">
        <div onClick={(e) => e.stopPropagation()}>
          <BaseCheckbox checked={selected} onCheckedChange={onToggle} />
        </div>
        <StatusIcon className={`h-5 w-5 shrink-0 ${statusConfig.color}`} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            {task.priority && (
              <Badge
                variant="secondary"
                className={`text-[10px] ${TASK_PRIORITY_COLORS[task.priority] ?? ""}`}
              >
                {task.priority}
              </Badge>
            )}
            {task.domain_group && (
              <Badge variant="secondary" className="text-[10px] font-mono">
                {task.domain_group}
              </Badge>
            )}
            {task.due_date && (
              <span className="text-xs text-muted-foreground tabular-nums">
                Due {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs text-muted-foreground max-w-[120px] truncate">
            <User className="h-3 w-3 shrink-0" />
            {assigneeName ?? "Unassigned"}
          </span>
          <Badge variant="outline" className="text-xs">
            {statusConfig.label}
          </Badge>
        </div>
      </div>
      {task.claude_code_prompt && (
        <div className="px-3 pb-3">
          <ClaudeCodePrompt prompt={task.claude_code_prompt} />
        </div>
      )}
    </div>
  );
}

function TasksTab({ productId }: TasksTabProps) {
  const { data: tasks, isLoading } = useTasks(productId);
  const { data: members = [] } = useProductMembers(productId);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [editTask, setEditTask] = useState<KanbanTask | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const createTask = useCreateTask(productId);

  const assigneeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      if (m.profile?.full_name) map.set(m.profile_id, m.profile.full_name);
    }
    return map;
  }, [members]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (assigneeFilter === "__unassigned__" && task.assignee_id) return false;
      if (assigneeFilter !== "all" && assigneeFilter !== "__unassigned__" && task.assignee_id !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, assigneeFilter]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    }
  }, [filteredTasks, selectedIds.size]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const statusCounts = useMemo(() => {
    if (!tasks) return {};
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      const s = task.status ?? "backlog";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ListTodo className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Tasks Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first task to get started.</p>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Task
          </Button>
          <AddTaskDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            defaultStatus="backlog"
            productId={productId}
            isLoading={createTask.isPending}
            onSubmit={(data) => {
              createTask.mutate(data, { onSuccess: () => setAddDialogOpen(false) });
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {(["backlog", "in_progress", "review", "done", "live"] as TaskStatus[]).map((status) => {
          const config = TASK_STATUS_DISPLAY[status];
          const Icon = config.icon;
          return (
            <Card key={status} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}>
              <CardContent className="p-3 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${statusFilter === status ? config.color : "text-muted-foreground"}`} />
                <div>
                  <p className="text-lg font-semibold tabular-nums">{statusCounts[status] ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Priority:</span>
        {(["all", "low", "medium", "high"] as const).map((priority) => (
          <Button
            key={priority}
            variant={priorityFilter === priority ? "default" : "outline"}
            size="sm"
            onClick={() => setPriorityFilter(priority)}
            className="text-xs capitalize"
          >
            {priority}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.profile_id} value={m.profile_id}>
                  {m.profile?.full_name ?? m.profile?.email ?? "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </span>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      <BulkAssignToolbar
        taskCount={filteredTasks.length}
        selectedIds={selectedIds}
        onToggleAll={toggleSelectAll}
        onClearSelection={clearSelection}
        productId={productId}
      />

      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            selected={selectedIds.has(task.id)}
            assigneeName={task.assignee_id ? assigneeMap.get(task.assignee_id) : undefined}
            onToggle={() => toggleSelect(task.id)}
            onClick={() => {
              setEditTask(toKanbanTask(task, assigneeMap));
              setEditDialogOpen(true);
            }}
          />
        ))}
      </div>

      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={editTask}
        productId={productId}
      />
      <AddTaskDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        defaultStatus="backlog"
        productId={productId}
        isLoading={createTask.isPending}
        onSubmit={(data) => {
          createTask.mutate(data, { onSuccess: () => setAddDialogOpen(false) });
        }}
      />
    </div>
  );
}

export { TasksTab };
export type { TasksTabProps };
