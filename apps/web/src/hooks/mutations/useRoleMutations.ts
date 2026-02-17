"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import { toast } from "sonner";

const INVALIDATION_KEYS = [
  ["users-management"],
  ["team", "profiles"],
  ["user-roles"],
  ["org-chart"],
];

function useInvalidateRoleQueries() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of INVALIDATION_KEYS) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export function useAssignRole() {
  const invalidate = useInvalidateRoleQueries();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      settingsRepository.assignRole(userId, role),
    onSuccess: () => {
      invalidate();
      toast.success("Role assigned");
    },
    onError: () => {
      toast.error("Failed to assign role");
    },
  });
}

export function useRemoveRole() {
  const invalidate = useInvalidateRoleQueries();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      settingsRepository.removeRole(userId, role),
    onSuccess: () => {
      invalidate();
      toast.success("Role removed");
    },
    onError: () => {
      toast.error("Failed to remove role");
    },
  });
}

export function useUpdatePrimaryRole() {
  const invalidate = useInvalidateRoleQueries();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      settingsRepository.updatePrimaryRole(userId, role),
    onSuccess: () => {
      invalidate();
      toast.success("Primary role updated");
    },
    onError: () => {
      toast.error("Failed to update primary role");
    },
  });
}
