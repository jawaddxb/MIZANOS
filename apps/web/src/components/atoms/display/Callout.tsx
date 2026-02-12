"use client";

import * as React from "react";
import { Info, AlertTriangle, AlertCircle, Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type CalloutType = "info" | "warning" | "error" | "tip";

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const calloutConfig: Record<
  CalloutType,
  { icon: React.ElementType; border: string; bg: string; text: string }
> = {
  info: {
    icon: Info,
    border: "border-blue-500/40",
    bg: "bg-blue-500/5",
    text: "text-blue-600 dark:text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/5",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  error: {
    icon: AlertCircle,
    border: "border-red-500/40",
    bg: "bg-red-500/5",
    text: "text-red-600 dark:text-red-400",
  },
  tip: {
    icon: Lightbulb,
    border: "border-green-500/40",
    bg: "bg-green-500/5",
    text: "text-green-600 dark:text-green-400",
  },
};

function Callout({ type, title, children, className }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border-l-4 p-4",
        config.border,
        config.bg,
        className
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.text)} />
        <div className="min-w-0">
          {title && (
            <p className={cn("font-semibold text-sm mb-1", config.text)}>
              {title}
            </p>
          )}
          <div className="text-sm text-foreground/80">{children}</div>
        </div>
      </div>
    </div>
  );
}

export { Callout };
export type { CalloutProps, CalloutType };
