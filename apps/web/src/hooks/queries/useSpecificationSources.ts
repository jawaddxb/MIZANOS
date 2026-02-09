"use client";

import { useQuery } from "@tanstack/react-query";
import { specificationsRepository } from "@/lib/api/repositories";
import type { SpecificationSource } from "@/lib/types";

export function useSpecificationSources(productId: string | undefined) {
  return useQuery({
    queryKey: ["specification-sources", productId],
    queryFn: (): Promise<SpecificationSource[]> => {
      if (!productId) return Promise.resolve([]);
      return specificationsRepository.getSources(productId);
    },
    enabled: !!productId,
  });
}
