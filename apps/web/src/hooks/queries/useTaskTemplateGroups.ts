"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskTemplateGroupsRepository } from "@/lib/api/repositories";
import type { TaskTemplateGroup, TaskTemplateGroupDetail } from "@/lib/types";
import { toast } from "sonner";

const QUERY_KEY = ["task-template-groups"];

export function useTaskTemplateGroups(sourceType?: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, sourceType ?? undefined],
    queryFn: async (): Promise<TaskTemplateGroup[]> => {
      const result = await taskTemplateGroupsRepository.getAll(
        sourceType ? { source_type: sourceType } : undefined,
      );
      return Array.isArray(result) ? result : result.data ?? [];
    },
    enabled: sourceType !== null,
  });
}

export function useTaskTemplateGroupDetail(groupId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, "detail", groupId],
    queryFn: () => taskTemplateGroupsRepository.getDetail(groupId!),
    enabled: !!groupId,
  });
}

export function useCreateTaskTemplateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TaskTemplateGroup>) =>
      taskTemplateGroupsRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Template group created");
    },
    onError: () => toast.error("Failed to create template group"),
  });
}

export function useUpdateTaskTemplateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TaskTemplateGroup>;
    }) => taskTemplateGroupsRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Template group updated");
    },
    onError: () => toast.error("Failed to update template group"),
  });
}

export function useDeleteTaskTemplateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskTemplateGroupsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Template group deleted");
    },
    onError: () => toast.error("Failed to delete template group"),
  });
}

export function useReorderTaskTemplateGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      taskTemplateGroupsRepository.reorder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => toast.error("Failed to reorder groups"),
  });
}
