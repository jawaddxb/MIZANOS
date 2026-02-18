"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import type { UserRole } from "@/lib/types";

export function useUserRoles(userId: string) {
  return useQuery<UserRole[]>({
    queryKey: ["user-roles", userId],
    queryFn: () => settingsRepository.getUserRoles(userId),
    enabled: !!userId,
  });
}

export function useAllUserRoles() {
  return useQuery<UserRole[]>({
    queryKey: ["user-roles"],
    queryFn: () => settingsRepository.getAllUserRoles(),
  });
}
