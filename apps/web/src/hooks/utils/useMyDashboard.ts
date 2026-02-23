"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAllTasks } from "@/hooks/queries/useAllTasks";
import { useAllProductMembers } from "@/hooks/queries/useProductMembers";

const STORAGE_KEY = "dashboard_my_view";

export function isMyDashboardEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function useMyDashboard() {
  const [enabled, setEnabled] = useState(isMyDashboardEnabled);
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

    const ids = new Set<string>();
    for (const m of allMembers) {
      if (m.profile_id === userId) ids.add(m.product_id);
    }
    for (const t of allTasks) {
      if (t.assignee_id === userId || t.created_by === userId) {
        ids.add(t.product_id);
      }
    }
    return ids;
  }, [enabled, user?.profile_id, dataLoading, allMembers, allTasks]);

  return { enabled, toggle, myProductIds };
}
