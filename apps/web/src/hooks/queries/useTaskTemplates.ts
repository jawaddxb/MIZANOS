"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskTemplatesRepository } from "@/lib/api/repositories";
import type { TaskTemplate } from "@/lib/types";
import { toast } from "sonner";

const QUERY_KEY = ["task-templates"];

export function useTaskTemplates(sourceType?: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, sourceType ?? undefined],
    queryFn: async (): Promise<TaskTemplate[]> => {
      const result = await taskTemplatesRepository.getAll(
        sourceType ? { source_type: sourceType } : undefined,
      );
      // Backend returns a plain array, not a paginated response
      return Array.isArray(result) ? result : result.data ?? [];
    },
    enabled: sourceType !== null,
  });
}

export function useCreateTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TaskTemplate>) =>
      taskTemplatesRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Task template created");
    },
    onError: () => {
      toast.error("Failed to create task template");
    },
  });
}

export function useUpdateTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskTemplate> }) =>
      taskTemplatesRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Task template updated");
    },
    onError: () => {
      toast.error("Failed to update task template");
    },
  });
}

export function useDeleteTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskTemplatesRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Task template deleted");
    },
    onError: () => {
      toast.error("Failed to delete task template");
    },
  });
}

export function useReorderTaskTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sourceType,
      orderedIds,
    }: {
      sourceType: string;
      orderedIds: string[];
    }) => taskTemplatesRepository.reorder(sourceType, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => {
      toast.error("Failed to reorder templates");
    },
  });
}
