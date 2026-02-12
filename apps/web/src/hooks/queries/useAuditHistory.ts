"use client";

import { useQuery } from "@tanstack/react-query";
import { auditRepository } from "@/lib/api/repositories";
import type { Audit } from "@/lib/types";

export function useAuditHistory(productId: string) {
  return useQuery({
    queryKey: ["audits", productId],
    queryFn: async (): Promise<Audit[]> => {
      const result = await auditRepository.getByProduct(productId, {
        sortBy: "run_at",
        sortOrder: "desc",
      });
      // Backend returns a plain array, not paginated
      return Array.isArray(result) ? result : result.data ?? [];
    },
    enabled: !!productId,
  });
}

export function useLatestAudit(productId: string) {
  return useQuery({
    queryKey: ["audits", productId, "latest"],
    queryFn: (): Promise<Audit | null> => auditRepository.getLatest(productId),
    enabled: !!productId,
  });
}
