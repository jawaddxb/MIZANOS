"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { ProjectIntegration } from "@/lib/types";
import { toast } from "sonner";

export function useIntegrationMutations(productId: string) {
  const queryClient = useQueryClient();

  const addIntegration = useMutation({
    mutationFn: (
      data: Omit<ProjectIntegration, "id" | "created_at" | "updated_at">,
    ) => productsRepository.createProjectIntegration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-integrations", productId],
      });
      toast.success("Integration added");
    },
    onError: (error: Error) => {
      toast.error("Failed to add integration: " + error.message);
    },
  });

  const updateIntegration = useMutation({
    mutationFn: ({
      id,
      ...updates
    }: Partial<ProjectIntegration> & { id: string }) =>
      productsRepository.updateProjectIntegration(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-integrations", productId],
      });
      toast.success("Integration updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update integration: " + error.message);
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: (id: string) =>
      productsRepository.deleteProjectIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-integrations", productId],
      });
      toast.success("Integration removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove integration: " + error.message);
    },
  });

  return { addIntegration, updateIntegration, deleteIntegration };
}
