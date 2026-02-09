"use client";

import { Badge } from "@/components/atoms/display/Badge";

interface TaskWorkloadBadgeProps {
  count: number;
  max?: number;
}

function getVariant(
  count: number,
  max: number,
): "default" | "secondary" | "destructive" {
  const ratio = count / max;
  if (ratio >= 0.9) return "destructive";
  if (ratio >= 0.6) return "default";
  return "secondary";
}

function TaskWorkloadBadge({ count, max = 10 }: TaskWorkloadBadgeProps) {
  const variant = getVariant(count, max);

  return (
    <Badge variant={variant} className="tabular-nums text-xs">
      {count} / {max} tasks
    </Badge>
  );
}

export { TaskWorkloadBadge };
export type { TaskWorkloadBadgeProps };
