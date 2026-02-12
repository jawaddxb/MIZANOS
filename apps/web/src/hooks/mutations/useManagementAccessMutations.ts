"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsRepository } from "@/lib/api/repositories";

export function useGrantManagementAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      featureKey,
      reason,
    }: {
      userId: string;
      featureKey: string;
      reason?: string;
    }) =>
      settingsRepository.createUserOverride({
        user_id: userId,
        feature_key: featureKey,
        override_type: "grant",
        reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["feature-permissions"] });
      toast.success("Management access granted");
    },
    onError: (error: Error) => {
      toast.error("Failed to grant access: " + error.message);
    },
  });
}

export function useRevokeManagementAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (overrideId: string) =>
      settingsRepository.deleteUserOverride(overrideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["feature-permissions"] });
      toast.success("Management access revoked");
    },
    onError: (error: Error) => {
      toast.error("Failed to revoke access: " + error.message);
    },
  });
}
