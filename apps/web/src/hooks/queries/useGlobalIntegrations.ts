"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import type { Integration } from "@/lib/types";
import { toast } from "sonner";

export function useGlobalIntegrations() {
  return useQuery({
    queryKey: ["global-integrations"],
    queryFn: (): Promise<Integration[]> =>
      settingsRepository.getIntegrations(),
  });
}

export function useGlobalIntegrationMutations() {
  const queryClient = useQueryClient();

  const createIntegration = useMutation({
    mutationFn: (data: Partial<Integration>) =>
      settingsRepository.createIntegration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-integrations"] });
      toast.success("Global integration created");
    },
    onError: () => {
      toast.error("Failed to create global integration");
    },
  });

  const updateIntegration = useMutation({
    mutationFn: ({
      id,
      ...data
    }: Partial<Integration> & { id: string }) =>
      settingsRepository.updateIntegration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-integrations"] });
      toast.success("Global integration updated");
    },
    onError: () => {
      toast.error("Failed to update global integration");
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: (id: string) => settingsRepository.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-integrations"] });
      toast.success("Global integration deleted");
    },
    onError: () => {
      toast.error("Failed to delete global integration");
    },
  });

  return { createIntegration, updateIntegration, deleteIntegration };
}
