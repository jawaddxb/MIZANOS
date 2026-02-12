"use client";

import { cn } from "@/lib/utils/cn";
import type { EngineerEvaluation } from "@/lib/types";

interface EvaluationBreakdownProps {
  evaluation: EngineerEvaluation | null;
}

const CATEGORIES = [
  {
    label: "Technical Skills",
    weight: "35%",
    fields: ["code_quality", "architecture", "ai_skills", "debugging"] as const,
  },
  {
    label: "Product & Business",
    weight: "25%",
    fields: ["understanding_requirements", "ui_ux_design"] as const,
  },
  {
    label: "Communication",
    weight: "20%",
    fields: ["communication", "team_behavior", "reliability"] as const,
  },
  {
    label: "Ownership & Leadership",
    weight: "20%",
    fields: ["ownership", "business_impact", "leadership"] as const,
  },
] as const;

const FIELD_LABELS: Record<string, string> = {
  code_quality: "Code Quality",
  architecture: "Architecture",
  ai_skills: "AI Skills",
  debugging: "Debugging",
  understanding_requirements: "Requirements",
  ui_ux_design: "UI/UX Design",
  communication: "Communication",
  team_behavior: "Team Behavior",
  reliability: "Reliability",
  ownership: "Ownership",
  business_impact: "Business Impact",
  leadership: "Leadership",
};

function scoreColor(score: number): string {
  if (score >= 4) return "text-status-healthy";
  if (score >= 3) return "text-status-warning";
  return "text-status-critical";
}

function barColor(score: number): string {
  if (score >= 4) return "bg-status-healthy";
  if (score >= 3) return "bg-status-warning";
  return "bg-status-critical";
}

function categoryAvg(
  evaluation: EngineerEvaluation,
  fields: readonly string[],
): number {
  const sum = fields.reduce(
    (acc, f) => acc + (evaluation[f as keyof EngineerEvaluation] as number),
    0,
  );
  return sum / fields.length;
}

export function EvaluationBreakdown({ evaluation }: EvaluationBreakdownProps) {
  if (!evaluation) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No evaluations recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Period: {evaluation.evaluation_period}
        </h3>
        <div className={cn("text-2xl font-bold", scoreColor(evaluation.overall_score))}>
          {evaluation.overall_score.toFixed(1)}
        </div>
      </div>

      {/* Category bars */}
      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const avg = categoryAvg(evaluation, cat.fields);
          return (
            <div key={cat.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{cat.label}</span>
                <span className="text-xs text-muted-foreground">
                  {cat.weight} &middot;{" "}
                  <span className={scoreColor(avg)}>{avg.toFixed(1)}</span>
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", barColor(avg))}
                  style={{ width: `${(avg / 5) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual scores grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CATEGORIES.flatMap((cat) =>
          cat.fields.map((field) => {
            const val = evaluation[field as keyof EngineerEvaluation] as number;
            return (
              <div
                key={field}
                className="flex items-center justify-between rounded border bg-card px-3 py-1.5"
              >
                <span className="text-xs text-muted-foreground">
                  {FIELD_LABELS[field]}
                </span>
                <span className={cn("text-sm font-semibold", scoreColor(val))}>
                  {val.toFixed(1)}
                </span>
              </div>
            );
          }),
        )}
      </div>

      {evaluation.notes && (
        <div className="rounded border bg-card p-3">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm">{evaluation.notes}</p>
        </div>
      )}
    </div>
  );
}
