"use client";

import { useQuery } from "@tanstack/react-query";
import { marketingRepository } from "@/lib/api/repositories";
import type {
  MarketingDomain,
  MarketingSocialHandle,
  MarketingCredential,
  MarketingChecklistItem,
} from "@/lib/types";

export function useMarketingDomains(productId: string) {
  return useQuery({
    queryKey: ["marketing-domains", productId],
    queryFn: (): Promise<MarketingDomain[]> =>
      marketingRepository.getDomains(productId),
    enabled: !!productId,
  });
}

export function useMarketingSocialHandles(productId: string) {
  return useQuery({
    queryKey: ["marketing-social-handles", productId],
    queryFn: (): Promise<MarketingSocialHandle[]> =>
      marketingRepository.getSocialHandles(productId),
    enabled: !!productId,
  });
}

export function useMarketingCredentials(productId: string) {
  return useQuery({
    queryKey: ["marketing-credentials", productId],
    queryFn: (): Promise<MarketingCredential[]> =>
      marketingRepository.getCredentials(productId),
    enabled: !!productId,
  });
}

export function useMarketingChecklist(productId: string) {
  return useQuery({
    queryKey: ["marketing-checklist", productId],
    queryFn: (): Promise<MarketingChecklistItem[]> =>
      marketingRepository.getChecklists(productId),
    enabled: !!productId,
  });
}
