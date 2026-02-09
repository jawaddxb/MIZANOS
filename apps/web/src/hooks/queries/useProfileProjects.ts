"use client";

import { useQuery } from "@tanstack/react-query";
import { teamRepository } from "@/lib/api/repositories";
import type { ProfileProject } from "@/lib/types";

export function useProfileProjects(profileId: string) {
  return useQuery({
    queryKey: ["profile-projects", profileId],
    queryFn: (): Promise<ProfileProject[]> =>
      teamRepository.getProfileProjects(profileId),
    enabled: !!profileId,
  });
}
