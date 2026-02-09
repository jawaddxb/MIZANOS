"use client";

import { useQuery } from "@tanstack/react-query";
import { teamRepository } from "@/lib/api/repositories";
import type { TaskCount } from "@/lib/types";

export function useProfileTaskCounts(profileIds: string[]) {
  return useQuery({
    queryKey: ["profile-task-counts", profileIds],
    queryFn: (): Promise<Record<string, TaskCount>> =>
      teamRepository.getProfileTaskCounts(profileIds),
    enabled: profileIds.length > 0,
  });
}
