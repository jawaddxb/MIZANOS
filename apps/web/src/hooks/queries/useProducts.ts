"use client";

import { useQuery } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { Product } from "@/lib/types";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const result = await productsRepository.getAll({
        sortBy: "updated_at",
        sortOrder: "desc",
      });
      return result.data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: (): Promise<Product> => productsRepository.getById(id),
    enabled: !!id,
  });
}
