"use client";

import { useQuery } from "@tanstack/react-query";
import { tasksRepository } from "@/lib/api/repositories";
import type { Task } from "@/lib/types";

export function useDraftTasks(productId: string) {
  return useQuery({
    queryKey: ["tasks", productId, "drafts"],
    queryFn: (): Promise<Task[]> => tasksRepository.getDrafts(productId),
    enabled: !!productId,
  });
}
