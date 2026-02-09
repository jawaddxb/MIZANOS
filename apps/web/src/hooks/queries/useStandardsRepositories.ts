"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import type { StandardsRepository } from "@/lib/types";
import { toast } from "sonner";

export function useStandardsRepositories() {
  return useQuery({
    queryKey: ["standards-repositories"],
    queryFn: (): Promise<StandardsRepository[]> =>
      settingsRepository.getStandardsRepositories(),
  });
}

export function useCreateStandardsRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: Pick<StandardsRepository, "name" | "url"> &
        Partial<Pick<StandardsRepository, "description" | "markdown_content">>,
    ) => settingsRepository.createStandardsRepository(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standards-repositories"] });
      toast.success("Repository added successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to add repository: " + error.message);
    },
  });
}

export function useUpdateStandardsRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Pick<
          StandardsRepository,
          "name" | "url" | "description" | "is_active" | "markdown_content"
        >
      >;
    }) => settingsRepository.updateStandardsRepository(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standards-repositories"] });
      toast.success("Repository updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update repository: " + error.message);
    },
  });
}

export function useDeleteStandardsRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      settingsRepository.deleteStandardsRepository(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standards-repositories"] });
      toast.success("Repository deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete repository: " + error.message);
    },
  });
}
