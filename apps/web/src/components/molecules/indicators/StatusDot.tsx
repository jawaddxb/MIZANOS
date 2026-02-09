"use client";

import { cn } from "@/lib/utils/cn";

type StatusType =
  | "active"
  | "completed"
  | "on_hold"
  | "cancelled"
  | "draft"
  | "in_progress"
  | "pending";

interface StatusDotProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  completed: "bg-blue-500",
  on_hold: "bg-yellow-500",
  cancelled: "bg-red-500",
  draft: "bg-gray-400",
  in_progress: "bg-emerald-500",
  pending: "bg-orange-400",
};

const SIZE_CLASSES: Record<string, string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

function StatusDot({ status, size = "md", className }: StatusDotProps) {
  const colorClass = STATUS_COLORS[status] || "bg-gray-400";
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={cn("inline-block shrink-0 rounded-full", sizeClass, colorClass, className)}
      aria-label={`Status: ${status}`}
    />
  );
}

export { StatusDot };
export type { StatusDotProps, StatusType };
