"use client";

import { useQuery } from "@tanstack/react-query";
import { vaultRepository } from "@/lib/api/repositories";
import type { CompanyCredential } from "@/lib/types";

export function useVaultCredentials(params?: {
  category?: string;
  productId?: string;
}) {
  return useQuery({
    queryKey: ["vault-credentials", params],
    queryFn: async (): Promise<CompanyCredential[]> => {
      if (params?.productId) {
        const result = await vaultRepository.getByProduct(params.productId);
        return result.data;
      }
      if (params?.category) {
        const result = await vaultRepository.getByCategory(params.category);
        return result.data;
      }
      const result = await vaultRepository.getAll({
        sortBy: "updated_at",
        sortOrder: "desc",
      });
      return result.data;
    },
  });
}
