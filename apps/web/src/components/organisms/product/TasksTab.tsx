"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { PillarBadge } from "@/components/molecules/indicators/PillarBadge";
import { useTasks } from "@/hooks/queries/useTasks";
import { ClaudeCodePrompt } from "@/components/molecules/tasks/ClaudeCodePrompt";
import { TASK_STATUS_DISPLAY, TASK_PRIORITY_COLORS } from "@/lib/constants";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { Filter, ListTodo } from "lucide-react";

interface TasksTabProps {
  productId: string;
}

type FilterStatus = TaskStatus | "all";
type FilterPriority = TaskPriority | "all";

function TaskRow({ task }: { task: Task }) {
  const statusConfig = TASK_STATUS_DISPLAY[task.status ?? "backlog"] ?? TASK_STATUS_DISPLAY.backlog;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 p-3">
        <StatusIcon className={`h-5 w-5 shrink-0 ${statusConfig.color}`} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            {task.pillar && <PillarBadge pillar={task.pillar} className="text-[10px]" />}
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

        <Badge variant="outline" className="shrink-0 text-xs">
          {statusConfig.label}
        </Badge>
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
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("all");

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [tasks, statusFilter, priorityFilter]);

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
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Tasks Yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Tasks will appear here once they are created for this product.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="grid grid-cols-4 gap-2 flex-1">
          {(["backlog", "in_progress", "review", "done"] as TaskStatus[]).map(
            (status) => {
              const config = TASK_STATUS_DISPLAY[status];
              const Icon = config.icon;
              const count = statusCounts[status] ?? 0;
              return (
                <Card
                  key={status}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() =>
                    setStatusFilter(statusFilter === status ? "all" : status)
                  }
                >
                  <CardContent className="p-3 flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 ${
                        statusFilter === status
                          ? config.color
                          : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="text-lg font-semibold tabular-nums">
                        {count}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {config.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
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
        <span className="ml-auto text-sm text-muted-foreground">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export { TasksTab };
export type { TasksTabProps };
