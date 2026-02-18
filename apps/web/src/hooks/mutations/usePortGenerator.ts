"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portGeneratorRepository } from "@/lib/api/repositories";
import type { LovableManifest, GenerateTasksResponse } from "@/lib/types";
import { toast } from "sonner";

export function useExtractManifest() {
  return useMutation({
    mutationFn: (sourcePath: string): Promise<LovableManifest> =>
      portGeneratorRepository.extract(sourcePath),
    onError: (error: Error) => {
      toast.error("Failed to scan project: " + error.message);
    },
  });
}

export function useGeneratePortTasks(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourcePath?: string): Promise<GenerateTasksResponse> =>
      portGeneratorRepository.generateTasks(productId, sourcePath),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", productId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", productId, "drafts"] });
      toast.success(
        `Generated ${data.tasks_created} draft tasks — review in Drafts tab`
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to generate tasks: " + error.message);
    },
  });
}
