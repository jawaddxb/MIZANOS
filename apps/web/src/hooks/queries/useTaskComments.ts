"use client";

import { useQuery } from "@tanstack/react-query";
import { taskCommentsRepository } from "@/lib/api/repositories";

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => taskCommentsRepository.getByTask(taskId),
    enabled: !!taskId,
  });
}
