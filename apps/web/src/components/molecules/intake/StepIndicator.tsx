"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { IntakeStep } from "@/components/organisms/intake/types";
import { STEP_LABELS } from "@/components/organisms/intake/types";

interface StepIndicatorProps {
  steps: readonly IntakeStep[];
  currentIndex: number;
  onStepClick: (step: IntakeStep) => void;
}

export function StepIndicator({ steps, currentIndex, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => (
        <button
          key={step}
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            idx === currentIndex && "bg-primary text-primary-foreground",
            idx < currentIndex && "text-green-600",
            idx > currentIndex && "text-muted-foreground",
          )}
          onClick={() => { if (idx <= currentIndex) onStepClick(steps[idx]); }}
          disabled={idx > currentIndex}
        >
          {idx < currentIndex ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full border text-xs">
              {idx + 1}
            </span>
          )}
          <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
        </button>
      ))}
    </div>
  );
}
