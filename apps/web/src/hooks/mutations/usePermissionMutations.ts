"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import type { PermissionAuditLog } from "@/lib/types";
import { toast } from "sonner";

export function useUpdateRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      permissionId,
      canAccess,
    }: {
      permissionId: string;
      canAccess: boolean;
    }) =>
      settingsRepository.updateRolePermission(permissionId, {
        can_access: canAccess,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["permission-audit-log"] });
      toast.success("Permission updated");
    },
    onError: () => {
      toast.error("Failed to update permission");
    },
  });
}

export function useCreateUserOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      user_id: string;
      feature_key: string;
      override_type: "grant" | "deny";
      reason?: string;
      expires_at?: string;
    }) => settingsRepository.createUserOverride(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["user-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["my-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["permission-audit-log"] });
      toast.success("Override created");
    },
    onError: () => {
      toast.error("Failed to create override");
    },
  });
}

export function useUpdateUserOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      override_type?: "grant" | "deny";
      reason?: string;
      expires_at?: string | null;
    }) => settingsRepository.updateUserOverride(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["user-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["my-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["permission-audit-log"] });
      toast.success("Override updated");
    },
    onError: () => {
      toast.error("Failed to update override");
    },
  });
}

export function useDeleteUserOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settingsRepository.deleteUserOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["user-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["my-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["permission-audit-log"] });
      toast.success("Override removed");
    },
    onError: () => {
      toast.error("Failed to remove override");
    },
  });
}

export function usePermissionAuditLog(limit = 50) {
  return useQuery({
    queryKey: ["permission-audit-log", limit],
    queryFn: (): Promise<PermissionAuditLog[]> =>
      settingsRepository.getPermissionAuditLog(limit),
  });
}
