"use client";

import { Progress } from "@/components/atoms/feedback/Progress";

interface WorkloadBarProps {
  current: number;
  capacity: number;
}

function WorkloadBar({ current, capacity }: WorkloadBarProps) {
  const percentage = capacity > 0 ? Math.round((current / capacity) * 100) : 0;
  const clamped = Math.min(percentage, 100);

  const colorClass =
    percentage >= 90
      ? "text-destructive"
      : percentage >= 60
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-green-600 dark:text-green-400";

  return (
    <div className="flex items-center gap-3">
      <Progress value={clamped} className="h-2 flex-1" />
      <span className={`text-xs font-medium tabular-nums ${colorClass}`}>
        {current}/{capacity}
      </span>
    </div>
  );
}

export { WorkloadBar };
export type { WorkloadBarProps };
