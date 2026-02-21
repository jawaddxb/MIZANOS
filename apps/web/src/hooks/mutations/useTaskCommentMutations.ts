"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskCommentsRepository } from "@/lib/api/repositories";
import { toast } from "sonner";

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      taskCommentsRepository.create(taskId, content, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
    onError: (error: Error) => {
      toast.error("Failed to post comment: " + error.message);
    },
  });
}

export function useUpdateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      taskCommentsRepository.update(taskId, commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update comment: " + error.message);
    },
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      taskCommentsRepository.delete(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
      toast.success("Comment deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete comment: " + error.message);
    },
  });
}
