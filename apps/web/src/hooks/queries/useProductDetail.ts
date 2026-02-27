"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import { githubRepository } from "@/lib/api/repositories/github.repository";
import type { Product, ProductMember, ProductEnvironment } from "@/lib/types";

interface ProductDetailResult {
  product: Product | null;
  members: ProductMember[];
  environments: ProductEnvironment[];
}

export function useProductDetail(productId: string) {
  const queryClient = useQueryClient();
  const checkedRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ["product-detail", productId],
    queryFn: async (): Promise<ProductDetailResult> => {
      const product = await productsRepository.getById(productId);

      const [members, environments] = await Promise.all([
        productsRepository.getMembers(productId).catch(() => []),
        productsRepository.getEnvironments(productId).catch(() => []),
      ]);

      return { product, members, environments };
    },
    enabled: !!productId,
  });

  // Auto-check repo access once per page load
  useEffect(() => {
    const product = query.data?.product;
    if (!product?.repository_url || checkedRef.current === productId) return;
    checkedRef.current = productId;
    githubRepository.checkRepoAccess(productId).then((result) => {
      if (result.status !== product.github_repo_status) {
        queryClient.invalidateQueries({ queryKey: ["product-detail", productId] });
      }
    }).catch(() => {});
  }, [productId, query.data, queryClient]);

  return query;
}
