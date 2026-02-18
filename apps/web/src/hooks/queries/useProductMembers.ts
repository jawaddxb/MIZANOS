"use client";

import { useQuery } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { ProductMember, TeamReadiness } from "@/lib/types";

export function useAllProductMembers() {
  return useQuery({
    queryKey: ["product-members", "all"],
    queryFn: (): Promise<ProductMember[]> =>
      productsRepository.getAllMembers(),
  });
}

export function useProductMembers(productId: string) {
  return useQuery({
    queryKey: ["product-members", productId],
    queryFn: (): Promise<ProductMember[]> =>
      productsRepository.getMembers(productId),
    enabled: !!productId,
  });
}

export function useTeamReadiness(productId: string) {
  return useQuery({
    queryKey: ["team-readiness", productId],
    queryFn: (): Promise<TeamReadiness> =>
      productsRepository.getTeamReadiness(productId),
    enabled: !!productId,
  });
}
