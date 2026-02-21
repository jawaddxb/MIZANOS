"use client";

import { useQuery } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";

export function useProductNotificationSettings(productId: string) {
  return useQuery({
    queryKey: ["product-notification-settings", productId],
    queryFn: () => productsRepository.getNotificationSettings(productId),
    enabled: !!productId,
  });
}
