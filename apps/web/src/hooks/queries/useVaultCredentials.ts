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
      // Backend returns plain arrays, not paginated
      const unwrap = (r: unknown) => Array.isArray(r) ? r : (r as { data?: CompanyCredential[] }).data ?? [];
      if (params?.productId) {
        const result = await vaultRepository.getByProduct(params.productId);
        return unwrap(result);
      }
      if (params?.category) {
        const result = await vaultRepository.getByCategory(params.category);
        return unwrap(result);
      }
      const result = await vaultRepository.getAll({
        sortBy: "updated_at",
        sortOrder: "desc",
      });
      return unwrap(result);
    },
  });
}
