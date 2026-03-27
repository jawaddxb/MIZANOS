"use client";

import { useQuery } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { ProjectLink } from "@/lib/types";

export function useProjectLinks(productId: string) {
  return useQuery({
    queryKey: ["project-links", productId],
    queryFn: (): Promise<ProjectLink[]> => productsRepository.getLinks(productId),
    enabled: !!productId,
  });
}
