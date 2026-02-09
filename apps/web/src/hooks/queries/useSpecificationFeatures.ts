"use client";

import { useQuery } from "@tanstack/react-query";
import { specificationsRepository } from "@/lib/api/repositories";
import type { SpecificationFeature } from "@/lib/types";

export function useSpecificationFeatures(productId: string | undefined) {
  return useQuery({
    queryKey: ["specification-features", productId],
    queryFn: (): Promise<SpecificationFeature[]> => {
      if (!productId) return Promise.resolve([]);
      return specificationsRepository.getFeatures(productId);
    },
    enabled: !!productId,
  });
}
