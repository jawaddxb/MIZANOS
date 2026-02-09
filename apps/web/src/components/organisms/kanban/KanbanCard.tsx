"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/atoms/display/Card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/atoms/display/Avatar";
import { Badge } from "@/components/atoms/display/Badge";
import { PillarBadge } from "@/components/molecules/indicators/PillarBadge";
import type { KanbanTask } from "@/lib/types";
import type { PillarType, TaskPriority } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Style maps                                                         */
/* ------------------------------------------------------------------ */

const PILLAR_BORDER: Record<PillarType, string> = {
  business: "border-l-pillar-business",
  marketing: "border-l-pillar-marketing",
  development: "border-l-pillar-development",
  product: "border-l-pillar-product",
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-muted-foreground",
  medium: "bg-status-warning",
  high: "bg-status-critical",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface KanbanCardProps {
  task: KanbanTask;
  isOverlay?: boolean;
  onClick?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KanbanCard({ task, isOverlay, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const initials =
    task.assignee
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-l-4 p-3 transition-shadow hover:shadow-md",
        PILLAR_BORDER[task.pillar],
        isDragging && "opacity-50 shadow-lg",
        isOverlay && "rotate-2 shadow-xl",
      )}
      onClick={onClick}
    >
      {/* Top row: drag handle + title */}
      <div className="flex items-start gap-2">
        <div
          className="mt-0.5 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Priority dot + title */}
          <div className="mb-1 flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 flex-shrink-0 rounded-full",
                PRIORITY_DOT[task.priority],
              )}
              title={PRIORITY_LABEL[task.priority]}
            />
            <h4 className="truncate text-sm font-medium text-foreground">
              {task.title}
            </h4>
          </div>

          {/* Description preview */}
          {task.description && (
            <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PillarBadge pillar={task.pillar} className="text-[10px]" />
        <Badge variant="outline" className="text-[10px]">
          {PRIORITY_LABEL[task.priority]}
        </Badge>
      </div>

      {/* Footer: assignee + due date */}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[80px] truncate text-xs text-muted-foreground">
              {task.assignee}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Unassigned</span>
          </div>
        )}

        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="font-mono">{task.dueDate}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
