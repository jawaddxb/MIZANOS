"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { githubRepository } from "@/lib/api/repositories";
import type { RepoScanHistory } from "@/lib/types";
import { toast } from "sonner";

export function useRepoScanHistory(productId: string) {
  return useQuery({
    queryKey: ["repo-scan-history", productId],
    queryFn: (): Promise<RepoScanHistory[]> =>
      githubRepository.getScanHistory(productId),
    enabled: !!productId,
  });
}

export function useLatestRepoScan(productId: string) {
  return useQuery({
    queryKey: ["repo-scan-latest", productId],
    queryFn: async (): Promise<RepoScanHistory | null> => {
      const scans = await githubRepository.getScanHistory(productId);
      return scans.length > 0 ? scans[0] : null;
    },
    enabled: !!productId,
  });
}

export function useTriggerRepoScan(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => githubRepository.triggerScan(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["repo-scan-history", productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["repo-scan-latest", productId],
      });
      if (data.status === "completed") {
        toast.success(`Scan complete: ${data.filesChanged ?? 0} files changed`);
      } else if (data.status === "no_changes") {
        toast.info("No changes detected since last scan");
      } else {
        toast.error(`Scan error: ${data.status}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to trigger scan: ${error.message}`);
    },
  });
}
