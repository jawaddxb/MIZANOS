"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsRepository, teamRepository } from "@/lib/api/repositories";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/constants/roles";
import type {
  FeaturePermission,
  RolePermission,
  UserOverride,
  FeatureKey,
} from "@/lib/types";

export function useFeaturePermissions() {
  return useQuery({
    queryKey: ["feature-permissions"],
    queryFn: (): Promise<FeaturePermission[]> =>
      settingsRepository.getFeaturePermissions(),
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: ["role-permissions"],
    queryFn: (): Promise<RolePermission[]> =>
      settingsRepository.getRolePermissions(),
  });
}

export function useUserOverrides(userId?: string) {
  return useQuery({
    queryKey: ["user-overrides", userId],
    queryFn: (): Promise<UserOverride[]> =>
      settingsRepository.getUserOverrides(userId),
    enabled: userId !== undefined,
  });
}

export function useAllUserOverrides() {
  return useQuery({
    queryKey: ["all-user-overrides"],
    queryFn: (): Promise<UserOverride[]> =>
      settingsRepository.getUserOverrides(),
  });
}

export function useMyPermissions() {
  const { user } = useAuth();

  const { data: userRoles = [] } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: (): Promise<string[]> =>
      teamRepository.getUserRoles(user!.id),
    enabled: !!user,
  });

  const {
    data: rolePermissions = [],
    isLoading: isLoadingPermissions,
  } = useRolePermissions();

  const { data: myOverrides = [] } = useQuery({
    queryKey: ["my-overrides", user?.id],
    queryFn: (): Promise<UserOverride[]> =>
      settingsRepository.getUserOverrides(user!.id),
    enabled: !!user,
  });

  const permissionMap = useMemo(() => {
    const map = new Map<string, boolean>();

    // Use DB role_permissions if available, otherwise fall back to defaults
    const hasDbPermissions = rolePermissions.length > 0;

    if (hasDbPermissions) {
      for (const rp of rolePermissions) {
        if (userRoles.includes(rp.role) && rp.can_access) {
          map.set(rp.feature_key, true);
        }
      }
    } else {
      for (const role of userRoles) {
        const defaults = DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS];
        if (!defaults) continue;
        if (defaults.includes("*")) {
          map.set("__wildcard__", true);
        } else {
          for (const key of defaults) map.set(key, true);
        }
      }
    }

    const now = new Date();
    for (const override of myOverrides) {
      if (override.expires_at && new Date(override.expires_at) < now) {
        continue;
      }
      map.set(override.feature_key, override.override_type === "grant");
    }

    return map;
  }, [userRoles, rolePermissions, myOverrides]);

  const hasPermission = useCallback(
    (featureKey: FeatureKey): boolean =>
      permissionMap.get("__wildcard__") || permissionMap.get(featureKey) || false,
    [permissionMap],
  );

  const isLoading = !user || userRoles.length === 0 || isLoadingPermissions;

  return { hasPermission, isLoading, userRoles, myOverrides };
}
