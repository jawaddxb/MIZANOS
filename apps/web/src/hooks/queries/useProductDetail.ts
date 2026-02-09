"use client";

import { useQuery } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { Product, ProductMember, ProductEnvironment } from "@/lib/types";

interface ProductDetailResult {
  product: Product | null;
  members: ProductMember[];
  environments: ProductEnvironment[];
}

export function useProductDetail(productId: string) {
  return useQuery({
    queryKey: ["product-detail", productId],
    queryFn: async (): Promise<ProductDetailResult> => {
      const [product, members, environments] = await Promise.all([
        productsRepository.getById(productId),
        productsRepository.getMembers(productId),
        productsRepository.getEnvironments(productId),
      ]);
      return { product, members, environments };
    },
    enabled: !!productId,
  });
}
