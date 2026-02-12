"use client";

import { useQuery } from "@tanstack/react-query";
import { specificationsRepository } from "@/lib/api/repositories";
import type { Specification, SpecificationFeature, SpecificationSource } from "@/lib/types";

export function useSpecifications(productId: string | undefined) {
  return useQuery({
    queryKey: ["specifications", productId],
    queryFn: async (): Promise<Specification[]> => {
      if (!productId) return [];
      return specificationsRepository.getByProduct(productId, {
        sortBy: "version",
        sortOrder: "desc",
      });
    },
    enabled: !!productId,
  });
}

export function useLatestSpecification(productId: string | undefined) {
  const { data: specifications, ...rest } = useSpecifications(productId);
  return {
    data: specifications?.[0] ?? null,
    ...rest,
  };
}

export function useSpecificationFeatures(productId: string) {
  return useQuery({
    queryKey: ["specification-features", productId],
    queryFn: (): Promise<SpecificationFeature[]> =>
      specificationsRepository.getFeatures(productId),
    enabled: !!productId,
  });
}

export function useSpecificationSources(productId: string | undefined) {
  return useQuery({
    queryKey: ["specification-sources", productId],
    queryFn: (): Promise<SpecificationSource[]> =>
      specificationsRepository.getSources(productId!),
    enabled: !!productId,
  });
}
