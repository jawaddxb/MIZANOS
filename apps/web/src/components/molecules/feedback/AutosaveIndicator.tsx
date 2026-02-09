"use client";

import { Check, Loader2, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  AutosaveStatus,
  { icon: React.ReactNode; label: string; className: string }
> = {
  idle: {
    icon: null,
    label: "",
    className: "opacity-0",
  },
  saving: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    label: "Saving...",
    className: "text-muted-foreground",
  },
  saved: {
    icon: <Check className="h-3.5 w-3.5" />,
    label: "Saved",
    className: "text-green-600 dark:text-green-400",
  },
  error: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: "Error saving",
    className: "text-destructive",
  },
};

function AutosaveIndicator({ status, className }: AutosaveIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs transition-opacity duration-200",
        config.className,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

export { AutosaveIndicator };
export type { AutosaveIndicatorProps, AutosaveStatus };
