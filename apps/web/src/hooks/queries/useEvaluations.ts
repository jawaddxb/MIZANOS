"use client";

import { useQuery } from "@tanstack/react-query";
import { evaluationRepository } from "@/lib/api/repositories";
import type {
  EngineerEvaluation,
  EvaluationSummary,
  ProjectCompletion,
} from "@/lib/types";

export function useEvaluationSummaries() {
  return useQuery({
    queryKey: ["evaluation-summaries"],
    queryFn: (): Promise<EvaluationSummary[]> =>
      evaluationRepository.getAllSummaries(),
  });
}

export function useEvaluations(profileId: string) {
  return useQuery({
    queryKey: ["evaluations", profileId],
    queryFn: (): Promise<EngineerEvaluation[]> =>
      evaluationRepository.getEvaluations(profileId),
    enabled: !!profileId,
  });
}

export function useProjectCompletions(profileId: string) {
  return useQuery({
    queryKey: ["project-completions", profileId],
    queryFn: (): Promise<ProjectCompletion[]> =>
      evaluationRepository.getCompletions(profileId),
    enabled: !!profileId,
  });
}

export function useEvaluationSummary(profileId: string) {
  return useQuery({
    queryKey: ["evaluation-summary", profileId],
    queryFn: (): Promise<EvaluationSummary> =>
      evaluationRepository.getSummary(profileId),
    enabled: !!profileId,
  });
}
