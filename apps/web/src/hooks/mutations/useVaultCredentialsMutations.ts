"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vaultRepository } from "@/lib/api/repositories";
import type { CompanyCredential } from "@/lib/types";

export function useCreateCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CompanyCredential>) =>
      vaultRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-credentials"] });
      toast.success("Credential created");
    },
    onError: (error: Error) => {
      toast.error("Failed to create credential: " + error.message);
    },
  });
}

export function useUpdateCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CompanyCredential> }) =>
      vaultRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-credentials"] });
      toast.success("Credential updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update credential: " + error.message);
    },
  });
}

export function useDeleteCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vaultRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-credentials"] });
      toast.success("Credential deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete credential: " + error.message);
    },
  });
}
