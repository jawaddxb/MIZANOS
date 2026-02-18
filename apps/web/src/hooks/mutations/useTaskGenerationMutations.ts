"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { specificationsRepository } from "@/lib/api/repositories";
import { apiClient } from "@/lib/api/client";
import type { Task } from "@/lib/types";
import { toast } from "sonner";

export function useGenerateTasksFromSpec(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Task[]> => {
      const response = await apiClient.post<Task[]>(
        `/specifications/${productId}/generate-tasks`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", productId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", productId, "drafts"] });
      toast.success(`Generated ${data.length} draft tasks — review in Drafts tab`);
    },
    onError: (error: Error) => {
      toast.error("Failed to generate tasks: " + error.message);
    },
  });
}

export function useGenerateTasksFromTemplates(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Task[]> => {
      const response = await apiClient.post<Task[]>(
        "/task-templates/apply",
        null,
        { params: { product_id: productId } },
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", productId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", productId, "drafts"] });
      toast.success(`Generated ${data.length} draft tasks — review in Drafts tab`);
    },
    onError: (error: Error) => {
      toast.error("Failed to generate tasks: " + error.message);
    },
  });
}
