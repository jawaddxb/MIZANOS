"use client";

import { useQuery } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { DeploymentChecklistItem } from "@/lib/types";

export function useDeploymentChecklist(productId: string) {
  return useQuery({
    queryKey: ["deployment-checklist", productId],
    queryFn: (): Promise<DeploymentChecklistItem[]> =>
      productsRepository.getChecklist(productId),
    enabled: !!productId,
  });
}
