"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { evaluationRepository } from "@/lib/api/repositories";
import type { EngineerEvaluation, ProjectCompletion } from "@/lib/types";
import { toast } from "sonner";

export function useCreateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      data,
    }: {
      profileId: string;
      data: Omit<
        EngineerEvaluation,
        "id" | "profile_id" | "evaluated_by" | "overall_score" | "created_at" | "updated_at"
      >;
    }): Promise<EngineerEvaluation> =>
      evaluationRepository.createEvaluation(profileId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["evaluations", variables.profileId],
      });
      queryClient.invalidateQueries({ queryKey: ["evaluation-summaries"] });
      toast.success("Evaluation created");
    },
    onError: (error: Error) => {
      toast.error("Failed to create evaluation: " + error.message);
    },
  });
}

export function useCreateCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      data,
    }: {
      profileId: string;
      data: {
        product_id: string;
        score?: number;
        quality_rating?: number;
        timeliness_rating?: number;
        collaboration_rating?: number;
        feedback?: string;
        role_on_project?: string;
        skills_demonstrated?: string[];
      };
    }): Promise<ProjectCompletion> =>
      evaluationRepository.createCompletion(profileId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project-completions", variables.profileId],
      });
      queryClient.invalidateQueries({ queryKey: ["evaluation-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Project completion recorded");
    },
    onError: (error: Error) => {
      toast.error("Failed to record completion: " + error.message);
    },
  });
}
