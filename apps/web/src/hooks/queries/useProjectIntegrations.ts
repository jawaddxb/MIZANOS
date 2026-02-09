"use client";

import { useQuery } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { ProjectIntegration } from "@/lib/types";

export function useProjectIntegrations(productId: string) {
  return useQuery({
    queryKey: ["project-integrations", productId],
    queryFn: (): Promise<ProjectIntegration[]> =>
      productsRepository.getProjectIntegrations(productId),
    enabled: !!productId,
  });
}
