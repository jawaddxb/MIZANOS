"use client";

import { useQuery } from "@tanstack/react-query";
import { qaRepository } from "@/lib/api/repositories";
import type { QACheck } from "@/lib/types";

export function useQAChecks(productId: string) {
  return useQuery({
    queryKey: ["qa-checks", productId],
    queryFn: async (): Promise<QACheck[]> => {
      const result = await qaRepository.getByProduct(productId);
      return result.data;
    },
    enabled: !!productId,
  });
}
