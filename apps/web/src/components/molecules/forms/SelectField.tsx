"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";

interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  error?: string;
  description?: string;
  placeholder?: string;
  options: SelectFieldOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function SelectField({
  label,
  error,
  description,
  placeholder,
  options,
  value,
  onValueChange,
  disabled,
  className,
  id,
}: SelectFieldProps) {
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
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={fieldId}
          className={cn(error && "border-destructive")}
          aria-invalid={!!error}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export { SelectField };
export type { SelectFieldProps, SelectFieldOption };
