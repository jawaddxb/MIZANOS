"use client";

import { useQuery } from "@tanstack/react-query";
import { knowledgeRepository } from "@/lib/api/repositories";
import type { KnowledgeEntry } from "@/lib/types";

export function useKnowledgeEntries(params?: {
  category?: string;
  productId?: string;
}) {
  return useQuery({
    queryKey: ["knowledge-entries", params],
    queryFn: async (): Promise<KnowledgeEntry[]> => {
      const queryParams: Record<string, string> = {};
      if (params?.category) queryParams.category = params.category;
      if (params?.productId) queryParams.product_id = params.productId;

      const result = await knowledgeRepository.getAll({
        ...queryParams,
        sortBy: "updated_at",
        sortOrder: "desc",
      });
      // Backend returns a plain array, not paginated
      return Array.isArray(result) ? result : result.data ?? [];
    },
  });
}
