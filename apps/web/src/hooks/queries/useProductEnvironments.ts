"use client";

import { useQuery } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { ProductEnvironment } from "@/lib/types";

export function useProductEnvironments(productId: string) {
  return useQuery({
    queryKey: ["product-environments", productId],
    queryFn: (): Promise<ProductEnvironment[]> =>
      productsRepository.getEnvironments(productId),
    enabled: !!productId,
  });
}
