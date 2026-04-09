"use client";

import { useQuery } from "@tanstack/react-query";
import { apiKeysRepository } from "@/lib/api/repositories";
import type { ApiKey } from "@/lib/types";

export const API_KEYS_KEY = "api-keys";

export function useApiKeys() {
  return useQuery({
    queryKey: [API_KEYS_KEY],
    queryFn: (): Promise<ApiKey[]> => apiKeysRepository.getAll(),
  });
}
