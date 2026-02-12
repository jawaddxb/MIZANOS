"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { githubRepository } from "@/lib/api/repositories";
import type { RepositoryAnalysis } from "@/lib/types";
import { toast } from "sonner";

export function useRepositoryAnalysis(productId: string) {
  return useQuery({
    queryKey: ["repository-analysis", productId],
    queryFn: (): Promise<RepositoryAnalysis | null> =>
      githubRepository.getAnalysis(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyzeRepository(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      repositoryUrl,
      branch,
    }: {
      repositoryUrl: string;
      branch?: string;
    }) => githubRepository.analyzeRepo(productId, repositoryUrl, branch),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["repository-analysis", productId],
      });
      toast.success("Repository analysis complete");
    },
    onError: (error: Error) => {
      toast.error("Analysis failed: " + error.message);
    },
  });
}
