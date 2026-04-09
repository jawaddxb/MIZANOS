"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiKeysRepository } from "@/lib/api/repositories";
import { API_KEYS_KEY } from "@/hooks/queries/useApiKeys";
import type { ApiKey, ApiKeyCreateResponse } from "@/lib/types";
import { toast } from "sonner";

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { label: string }): Promise<ApiKeyCreateResponse> =>
      apiKeysRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_KEYS_KEY] });
    },
    onError: (error: Error) => {
      toast.error("Failed to create API key: " + error.message);
    },
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; label?: string; is_active?: boolean }): Promise<ApiKey> =>
      apiKeysRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_KEYS_KEY] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update API key: " + error.message);
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => apiKeysRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_KEYS_KEY] });
      toast.success("API key deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
}
