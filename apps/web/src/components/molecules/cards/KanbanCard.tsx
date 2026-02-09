"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/atoms/display/Card";

interface KanbanCardProps {
  id: string;
  title: string;
  assignee?: string;
  priority?: "low" | "medium" | "high" | "critical";
  className?: string;
  onClick?: () => void;
}

const PRIORITY_CLASSES: Record<string, string> = {
  low: "border-l-green-500",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

function KanbanCard({
  title,
  assignee,
  priority,
  className,
  onClick,
}: KanbanCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer border-l-4 transition-shadow hover:shadow-md",
        priority && PRIORITY_CLASSES[priority],
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <p className="text-sm font-medium">{title}</p>
        {assignee && (
          <p className="mt-1 text-xs text-muted-foreground">{assignee}</p>
        )}
      </CardContent>
    </Card>
  );
}

export { KanbanCard };
export type { KanbanCardProps };
