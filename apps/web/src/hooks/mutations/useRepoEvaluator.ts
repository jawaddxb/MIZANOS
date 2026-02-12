"use client";

import { useMutation } from "@tanstack/react-query";
import { repoEvaluatorRepository } from "@/lib/api/repositories";
import type { EvaluationResult } from "@/lib/types";
import { toast } from "sonner";

export function useEvaluateRepo() {
  return useMutation({
    mutationFn: (repoPath: string): Promise<EvaluationResult> =>
      repoEvaluatorRepository.evaluate(repoPath),
    onError: (error: Error) => {
      toast.error("Evaluation failed: " + error.message);
    },
  });
}
