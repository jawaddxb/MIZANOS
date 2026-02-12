"use client";

import { useQuery } from "@tanstack/react-query";
import { productsRepository, tasksRepository, qaRepository, auditRepository, notificationsRepository } from "@/lib/api/repositories";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, Task, QACheck, Audit, Notification } from "@/lib/types";

export interface DashboardMetrics {
  overdueTasks: Array<{
    id: string;
    title: string;
    due_date: string;
    product_id: string;
    product_name: string;
    assignee_name: string | null;
    priority: string;
  }>;
  failedQAChecks: Array<{
    id: string;
    title: string;
    product_id: string;
    product_name: string;
    category: string;
  }>;
  lowScoreAudits: Array<{
    product_id: string;
    product_name: string;
    overall_score: number;
    run_at: string;
  }>;
  incompleteDeployments: Array<{
    product_id: string;
    product_name: string;
    total_items: number;
    completed_items: number;
    stage: string;
  }>;
  stageDistribution: Array<{
    stage: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    product_id: string;
    product_name: string;
    created_at: string;
  }>;
}

export function useDashboardMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-metrics", user?.id],
    queryFn: async (): Promise<DashboardMetrics> => {
      const [productsResult, notifications] = await Promise.all([
        productsRepository.getAll({ pageSize: 100 }),
        notificationsRepository.getAll(),
      ]);

      // Backend returns a plain array, not paginated
      const products = Array.isArray(productsResult) ? productsResult : productsResult.data ?? [];

      const stageMap: Record<string, number> = {};
      for (const p of products) {
        const stage = p.stage || "Unknown";
        stageMap[stage] = (stageMap[stage] || 0) + 1;
      }
      const stageDistribution = Object.entries(stageMap).map(
        ([stage, count]) => ({ stage, count }),
      );

      const recentActivity = notifications.slice(0, 10).map((n: Notification) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        product_id: n.product_id || "",
        product_name: "",
        created_at: n.created_at,
      }));

      return {
        overdueTasks: [],
        failedQAChecks: [],
        lowScoreAudits: [],
        incompleteDeployments: [],
        stageDistribution,
        recentActivity,
      };
    },
    staleTime: 30_000,
  });
}
