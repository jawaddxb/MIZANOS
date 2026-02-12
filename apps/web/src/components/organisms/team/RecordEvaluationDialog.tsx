"use client";

import { useState } from "react";
import { Button } from "@/components/molecules/buttons/Button";
import { useCreateEvaluation } from "@/hooks/mutations/useEvaluationMutations";

const SCORE_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

const CATEGORIES = [
  {
    label: "Technical Skills",
    fields: [
      { key: "code_quality", label: "Code Quality" },
      { key: "architecture", label: "Architecture" },
      { key: "ai_skills", label: "AI Skills" },
      { key: "debugging", label: "Debugging" },
    ],
  },
  {
    label: "Product & Business",
    fields: [
      { key: "understanding_requirements", label: "Requirements" },
      { key: "ui_ux_design", label: "UI/UX Design" },
    ],
  },
  {
    label: "Communication",
    fields: [
      { key: "communication", label: "Communication" },
      { key: "team_behavior", label: "Team Behavior" },
      { key: "reliability", label: "Reliability" },
    ],
  },
  {
    label: "Ownership & Leadership",
    fields: [
      { key: "ownership", label: "Ownership" },
      { key: "business_impact", label: "Business Impact" },
      { key: "leadership", label: "Leadership" },
    ],
  },
] as const;

type ScoreKey = (typeof CATEGORIES)[number]["fields"][number]["key"];

const DEFAULT_SCORES: Record<ScoreKey, number> = {
  code_quality: 3,
  architecture: 3,
  ai_skills: 3,
  debugging: 3,
  understanding_requirements: 3,
  ui_ux_design: 3,
  communication: 3,
  team_behavior: 3,
  reliability: 3,
  ownership: 3,
  business_impact: 3,
  leadership: 3,
};

interface RecordEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
}

export function RecordEvaluationDialog({
  open,
  onOpenChange,
  profileId,
}: RecordEvaluationDialogProps) {
  const createEvaluation = useCreateEvaluation();
  const [period, setPeriod] = useState("");
  const [scores, setScores] = useState<Record<ScoreKey, number>>({ ...DEFAULT_SCORES });
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const resetForm = () => {
    setPeriod("");
    setScores({ ...DEFAULT_SCORES });
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvaluation.mutate(
      {
        profileId,
        data: {
          evaluation_period: period,
          ...scores,
          notes: notes || null,
        },
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  };

  const updateScore = (key: ScoreKey, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Record Evaluation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Evaluation Period *</label>
            <input
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. Q1 2026, 2025 Annual"
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              required
            />
          </div>

          {CATEGORIES.map((cat) => (
            <div key={cat.label} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{cat.label}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.fields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between gap-2">
                    <label className="text-sm">{field.label}</label>
                    <select
                      value={scores[field.key]}
                      onChange={(e) => updateScore(field.key, parseFloat(e.target.value))}
                      className="h-8 w-20 rounded-md border bg-background px-2 text-sm"
                    >
                      {SCORE_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v.toFixed(1)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional observations..."
              className="w-full min-h-[60px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!period || createEvaluation.isPending}>
              {createEvaluation.isPending ? "Saving..." : "Save Evaluation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
