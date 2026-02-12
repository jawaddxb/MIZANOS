"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsRepository } from "@/lib/api/repositories";
import type { DocumentAccessLink } from "@/lib/types";
import { toast } from "sonner";

const QUERY_KEY = "document-access-links";

export function useAccessLinks(productId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, productId],
    queryFn: (): Promise<DocumentAccessLink[]> =>
      documentsRepository.getAccessLinks(productId),
    enabled: !!productId,
  });
}

export function useCreateAccessLink(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; expires_at?: string }) =>
      documentsRepository.createAccessLink({ ...data, product_id: productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] });
      toast.success("Access link created");
    },
    onError: (e: Error) => toast.error("Failed to create link: " + e.message),
  });
}

export function useRevokeAccessLink(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) =>
      documentsRepository.revokeAccessLink(productId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] });
      toast.success("Access link revoked");
    },
    onError: (e: Error) => toast.error("Failed to revoke link: " + e.message),
  });
}
