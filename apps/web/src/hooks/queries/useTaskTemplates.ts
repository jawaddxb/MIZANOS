"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskTemplatesRepository } from "@/lib/api/repositories";
import type { TaskTemplate } from "@/lib/types";
import { toast } from "sonner";

const QUERY_KEY = ["task-templates"];

export function useTaskTemplates(sourceType?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, sourceType],
    queryFn: async () => {
      const result = await taskTemplatesRepository.getAll(
        sourceType ? { source_type: sourceType } : undefined,
      );
      return result.data;
    },
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
