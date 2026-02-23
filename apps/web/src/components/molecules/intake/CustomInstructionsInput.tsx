"use client";

import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";

interface CustomInstructionsInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomInstructionsInput({ value, onChange }: CustomInstructionsInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Custom Instructions (Optional)</label>
      <p className="text-xs text-muted-foreground">
        Provide instructions to guide AI spec generation. Saved with each specification version for audit.
      </p>
      <BaseTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          "e.g., Focus on mobile-first design and Arabic RTL support.\n" +
          "Prioritize security — we handle financial data.\n" +
          "Target audience is non-technical users — keep the UI simple."
        }
        className="min-h-[80px]"
        rows={3}
      />
    </div>
  );
}
