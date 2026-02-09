"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksRepository } from "@/lib/api/repositories";
import type { Task } from "@/lib/types";
import { toast } from "sonner";

export function useCreateTask(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<Task>): Promise<Task> =>
      tasksRepository.create({ ...input, product_id: productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", productId] });
      toast.success("Task created");
    },
    onError: (error: Error) => {
      toast.error("Failed to create task: " + error.message);
    },
  });
}

export function useUpdateTask(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Task>): Promise<Task> =>
      tasksRepository.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", productId] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update task: " + error.message);
    },
  });
}

export function useDeleteTask(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string): Promise<void> =>
      tasksRepository.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", productId] });
      toast.success("Task deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete task: " + error.message);
    },
  });
}

export function useReorderTask() {
  return useMutation({
    mutationFn: ({
      taskId,
      newIndex,
      status,
    }: {
      taskId: string;
      newIndex: number;
      status?: string;
    }): Promise<void> => tasksRepository.reorder(taskId, newIndex, status),
  });
}
