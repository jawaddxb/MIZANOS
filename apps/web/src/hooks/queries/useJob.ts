"use client";

import { useQuery } from "@tanstack/react-query";
import { jobsRepository } from "@/lib/api/repositories";
import type { Job } from "@/lib/types";

const ACTIVE_STATUSES = new Set(["pending", "running"]);
const POLL_INTERVAL_MS = 2000;

export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: ["jobs", jobId],
    queryFn: (): Promise<Job> => jobsRepository.getById(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && ACTIVE_STATUSES.has(status)) return POLL_INTERVAL_MS;
      return false;
    },
  });
}
