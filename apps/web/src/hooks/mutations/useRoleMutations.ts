"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import { toast } from "sonner";

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      settingsRepository.assignRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      queryClient.invalidateQueries({ queryKey: ["team", "profiles"] });
      toast.success("Role assigned");
    },
    onError: () => {
      toast.error("Failed to assign role");
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      settingsRepository.removeRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      queryClient.invalidateQueries({ queryKey: ["team", "profiles"] });
      toast.success("Role removed");
    },
    onError: () => {
      toast.error("Failed to remove role");
    },
  });
}
