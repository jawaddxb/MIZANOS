"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

interface BaseTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const BaseTextarea = React.forwardRef<HTMLTextAreaElement, BaseTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
BaseTextarea.displayName = "BaseTextarea";

export { BaseTextarea };
export type { BaseTextareaProps };
