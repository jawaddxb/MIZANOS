"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";

interface TextFieldProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
  description?: string;
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, description, className, id, ...props }, ref) => {
    const fieldId = id || React.useId();

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <BaseLabel
            htmlFor={fieldId}
            className={cn(error && "text-destructive")}
          >
            {label}
          </BaseLabel>
        )}
        <BaseInput
          id={fieldId}
          ref={ref}
          className={cn(error && "border-destructive")}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${fieldId}-error` : description ? `${fieldId}-desc` : undefined
          }
          {...props}
        />
        {description && !error && (
          <p id={`${fieldId}-desc`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);
TextField.displayName = "TextField";

export { TextField };
export type { TextFieldProps };
