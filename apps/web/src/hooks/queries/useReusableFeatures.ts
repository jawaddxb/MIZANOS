"use client";

import { useQuery } from "@tanstack/react-query";
import { specificationsRepository } from "@/lib/api/repositories";
import type { SpecificationFeature } from "@/lib/types";

export interface ReusableFeatureWithProduct extends SpecificationFeature {
  product_name: string;
  repository_url: string | null;
  import_count: number;
}

export function useReusableLibrary() {
  return useQuery({
    queryKey: ["reusable-features"],
    queryFn: () =>
      specificationsRepository.getReusableFeatures() as Promise<ReusableFeatureWithProduct[]>,
  });
}

export function useReusableFeaturesForImport(productId: string | undefined) {
  return useQuery({
    queryKey: ["reusable-features", "import", productId],
    queryFn: () =>
      specificationsRepository.getReusableFeatures(productId) as Promise<ReusableFeatureWithProduct[]>,
    enabled: !!productId,
  });
}
