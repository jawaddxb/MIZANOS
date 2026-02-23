"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAllTasks } from "@/hooks/queries/useAllTasks";
import { useAllProductMembers } from "@/hooks/queries/useProductMembers";
import type { ProductMember, Task } from "@/lib/types";

const STORAGE_KEY = "dashboard_my_view";

export function isMyDashboardEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

/** Returns product IDs where the user is a team member, task assignee, or task creator. */
export function buildMyProjectIds(
  userId: string,
  members: ProductMember[],
  tasks: Task[],
): Set<string> {
  const ids = new Set<string>();
  for (const m of members) {
    if (m.profile_id === userId) ids.add(m.product_id);
  }
  for (const t of tasks) {
    if (t.assignee_id === userId || t.created_by === userId) {
      ids.add(t.product_id);
    }
  }
  return ids;
}

export function useMyDashboard() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(isMyDashboardEnabled());
  }, []);
  const { user } = useAuth();
  const { data: allTasks = [], isLoading: tasksLoading } = useAllTasks();
  const { data: allMembers = [], isLoading: membersLoading } = useAllProductMembers();

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const dataLoading = tasksLoading || membersLoading;

  const myProductIds = useMemo<Set<string> | undefined>(() => {
    if (!enabled) return undefined;
    const userId = user?.profile_id;
    if (!userId || dataLoading) return undefined;
    return buildMyProjectIds(userId, allMembers, allTasks);
  }, [enabled, user?.profile_id, dataLoading, allMembers, allTasks]);

  return { enabled, toggle, myProductIds };
}
