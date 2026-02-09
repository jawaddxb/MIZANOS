"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { Badge } from "@/components/atoms/display/Badge";
import { KanbanCard } from "./KanbanCard";
import type { KanbanColumn as KanbanColumnType } from "@/lib/types";
import type { TaskStatus } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Style maps                                                         */
/* ------------------------------------------------------------------ */

const COLUMN_BG: Record<TaskStatus, string> = {
  backlog: "bg-muted/40",
  in_progress: "bg-blue-50/50 dark:bg-blue-950/20",
  review: "bg-amber-50/50 dark:bg-amber-950/20",
  done: "bg-green-50/50 dark:bg-green-950/20",
};

const COUNT_VARIANT: Record<TaskStatus, "secondary" | "default" | "outline"> = {
  backlog: "secondary",
  in_progress: "outline",
  review: "outline",
  done: "secondary",
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface KanbanColumnProps {
  column: KanbanColumnType;
  onAddTask?: (columnId: TaskStatus) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KanbanColumn({ column, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {column.title}
          </h3>
          <Badge
            variant={COUNT_VARIANT[column.id]}
            className="px-1.5 py-0.5 text-xs font-mono"
          >
            {column.tasks.length}
          </Badge>
        </div>

        <BaseButton
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onAddTask?.(column.id)}
          aria-label={`Add task to ${column.title}`}
        >
          <Plus className="h-4 w-4" />
        </BaseButton>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-lg p-2 transition-colors",
          "min-h-[200px]",
          COLUMN_BG[column.id],
          isOver && "ring-2 ring-primary ring-offset-2",
        )}
      >
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-muted-foreground">
              No tasks
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
