"use client";

import { useQuery } from "@tanstack/react-query";
import { teamRepository } from "@/lib/api/repositories";
import type { Profile } from "@/lib/types";

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async (): Promise<Profile[]> => {
      const result = await teamRepository.getProfiles({
        sortBy: "full_name",
        sortOrder: "asc",
      });
      // Backend returns a plain array, not paginated
      return Array.isArray(result) ? result : result.data ?? [];
    },
  });
}

export function useProfile(profileId: string) {
  return useQuery({
    queryKey: ["profiles", profileId],
    queryFn: (): Promise<Profile> => teamRepository.getProfile(profileId),
    enabled: !!profileId,
  });
}
