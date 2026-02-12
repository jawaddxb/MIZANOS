"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ExternalDocumentLink } from "@/lib/types";
import { toast } from "sonner";

const QUERY_KEY = "external-documents";

export function useExternalDocuments(productId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, productId],
    queryFn: async (): Promise<ExternalDocumentLink[]> => {
      const response = await apiClient.get<ExternalDocumentLink[]>(
        `/products/${productId}/external-documents`,
      );
      return response.data;
    },
    enabled: !!productId,
  });
}

export function useAddExternalDocument(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      url: string;
      doc_type: string;
      category: string;
      description?: string;
    }): Promise<ExternalDocumentLink> => {
      const response = await apiClient.post<ExternalDocumentLink>(
        `/products/${productId}/external-documents`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] });
      toast.success("External document added");
    },
    onError: (error: Error) => {
      toast.error("Failed to add document: " + error.message);
    },
  });
}

export function useDeleteExternalDocument(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string): Promise<void> => {
      await apiClient.delete(
        `/products/${productId}/external-documents/${documentId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] });
      toast.success("External document removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove document: " + error.message);
    },
  });
}
