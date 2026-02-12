"use client";

import { useState } from "react";
import { Button } from "@/components/molecules/buttons/Button";
import { useProducts } from "@/hooks/queries/useProducts";
import { useCreateCompletion } from "@/hooks/mutations/useEvaluationMutations";

const SCORE_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

interface RecordCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
}

export function RecordCompletionDialog({
  open,
  onOpenChange,
  profileId,
}: RecordCompletionDialogProps) {
  const { data: products = [] } = useProducts();
  const createCompletion = useCreateCompletion();

  const [projectId, setProjectId] = useState("");
  const [qualityRating, setQualityRating] = useState<number>(3);
  const [timelinessRating, setTimelinessRating] = useState<number>(3);
  const [collaborationRating, setCollaborationRating] = useState<number>(3);
  const [feedback, setFeedback] = useState("");
  const [roleOnProject, setRoleOnProject] = useState("");
  const [skillsInput, setSkillsInput] = useState("");

  if (!open) return null;

  const resetForm = () => {
    setProjectId("");
    setQualityRating(3);
    setTimelinessRating(3);
    setCollaborationRating(3);
    setFeedback("");
    setRoleOnProject("");
    setSkillsInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    createCompletion.mutate(
      {
        profileId,
        data: {
          product_id: projectId,
          quality_rating: qualityRating,
          timeliness_rating: timelinessRating,
          collaboration_rating: collaborationRating,
          feedback: feedback || undefined,
          role_on_project: roleOnProject || undefined,
          skills_demonstrated: skills.length > 0 ? skills : undefined,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Record Completion</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              required
            >
              <option value="">Select a project</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Ratings (1-5)</h3>
            {[
              { label: "Quality", value: qualityRating, setter: setQualityRating },
              { label: "Timeliness", value: timelinessRating, setter: setTimelinessRating },
              { label: "Collaboration", value: collaborationRating, setter: setCollaborationRating },
            ].map(({ label, value, setter }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <label className="text-sm">{label}</label>
                <select
                  value={value}
                  onChange={(e) => setter(parseFloat(e.target.value))}
                  className="h-8 w-20 rounded-md border bg-background px-2 text-sm"
                >
                  {SCORE_OPTIONS.map((v) => (
                    <option key={v} value={v}>{v.toFixed(1)}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role on Project</label>
            <input
              value={roleOnProject}
              onChange={(e) => setRoleOnProject(e.target.value)}
              placeholder="e.g. Lead Engineer, Frontend Dev"
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Skills Demonstrated</label>
            <input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="React, TypeScript, API Design (comma-separated)"
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Details about the completion..."
              className="w-full min-h-[60px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!projectId || createCompletion.isPending}>
              {createCompletion.isPending ? "Recording..." : "Record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
