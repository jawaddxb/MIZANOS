"use client";

import { useQuery } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { Stakeholder } from "@/lib/types";

export function useStakeholders(productId: string) {
  return useQuery({
    queryKey: ["stakeholders", productId],
    queryFn: (): Promise<Stakeholder[]> =>
      productsRepository.getStakeholders(productId),
    enabled: !!productId,
  });
}
