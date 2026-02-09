"use client";

import { cn } from "@/lib/utils/cn";

interface HealthScoreProps {
  score: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getScoreColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return "text-green-600 dark:text-green-400";
  if (pct >= 60) return "text-yellow-600 dark:text-yellow-400";
  if (pct >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreLabel(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return "Healthy";
  if (pct >= 60) return "Fair";
  if (pct >= 40) return "At Risk";
  return "Critical";
}

const SIZE_CLASSES = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

function HealthScore({
  score,
  max = 100,
  showLabel = true,
  size = "md",
  className,
}: HealthScoreProps) {
  const colorClass = getScoreColor(score, max);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("font-bold tabular-nums", SIZE_CLASSES[size], colorClass)}>
        {score}
      </span>
      {showLabel && (
        <span className={cn("text-sm text-muted-foreground")}>
          {getScoreLabel(score, max)}
        </span>
      )}
    </div>
  );
}

export { HealthScore };
export type { HealthScoreProps };
