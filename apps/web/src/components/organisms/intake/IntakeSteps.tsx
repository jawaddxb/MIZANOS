"use client";

import { cn } from "@/lib/utils/cn";
import { CheckCircle2, Circle } from "lucide-react";

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface IntakeStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function IntakeSteps({ steps, currentStep, onStepClick }: IntakeStepsProps) {
  return (
    <nav className="space-y-1">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        return (
          <button
            key={step.id}
            onClick={() => onStepClick?.(index)}
            disabled={index > currentStep}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
              isCurrent && "bg-primary/5 border border-primary/20",
              isComplete && "hover:bg-accent",
              !isCurrent && !isComplete && "opacity-50",
            )}
          >
            <div className="flex-shrink-0">
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-status-healthy" />
              ) : (
                <Circle className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-muted-foreground")} />
              )}
            </div>
            <div>
              <p className={cn("text-sm font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
