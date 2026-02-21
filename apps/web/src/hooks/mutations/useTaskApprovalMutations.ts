"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksRepository } from "@/lib/api/repositories";
import type { Task } from "@/lib/types";
import { toast } from "sonner";

export function useApproveTask(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string): Promise<Task> =>
      tasksRepository.approveTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", productId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", productId, "drafts"] });
      toast.success("Task approved");
    },
    onError: (error: Error) => {
      toast.error("Failed to approve task: " + error.message);
    },
  });
}

export function useBulkApproveTasks(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskIds: string[]) =>
      tasksRepository.bulkApproveTasks(taskIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", productId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", productId, "drafts"] });
      toast.success(`Approved ${data.approved_count} tasks`);
    },
    onError: (error: Error) => {
      toast.error("Failed to approve tasks: " + error.message);
    },
  });
}

export function useRejectDraftTask(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      tasksRepository.rejectTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", productId, "drafts"] });
      toast.success("Draft task rejected");
    },
    onError: (error: Error) => {
      toast.error("Failed to reject task: " + error.message);
    },
  });
}

export function useBulkRejectDraftTasks(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskIds: string[]) =>
      tasksRepository.bulkRejectTasks(taskIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", productId, "drafts"] });
      toast.success("Draft tasks rejected");
    },
    onError: (error: Error) => {
      toast.error("Failed to reject tasks: " + error.message);
    },
  });
}
