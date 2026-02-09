"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";

interface CheckboxFieldProps {
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function CheckboxField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
  id,
}: CheckboxFieldProps) {
  const fieldId = id || React.useId();

  return (
    <div className={cn("flex items-start space-x-3", className)}>
      <BaseCheckbox
        id={fieldId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="space-y-1 leading-none">
        <BaseLabel htmlFor={fieldId} className="cursor-pointer">
          {label}
        </BaseLabel>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

export { CheckboxField };
export type { CheckboxFieldProps };
