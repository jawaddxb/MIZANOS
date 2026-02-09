"use client";

import { type ReactNode } from "react";

import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/lib/types/enums";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PermissionGateProps {
  /** The role(s) a user must have for the children to render. */
  allowedRoles: AppRole | AppRole[];
  /** Content shown when the user has the required role. */
  children: ReactNode;
  /** Optional fallback rendered when the user lacks the required role. */
  fallback?: ReactNode;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface UserWithRole {
  id: string;
  email: string;
  full_name?: string;
  role?: AppRole;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Conditionally renders children based on the current user's role.
 *
 * Usage:
 * ```tsx
 * <PermissionGate allowedRoles={["admin", "pm"]}>
 *   <SensitivePanel />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  allowedRoles,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <>{fallback}</>;

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const userWithRole = user as UserWithRole;

  if (!userWithRole.role || !roles.includes(userWithRole.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
