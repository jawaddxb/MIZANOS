"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { systemDocumentsRepository } from "@/lib/api/repositories";
import type { SystemDocument, GenerateDocsResponse } from "@/lib/types";
import { toast } from "sonner";

export function useSystemDocuments(productId: string) {
  return useQuery({
    queryKey: ["system-documents", productId],
    queryFn: async (): Promise<SystemDocument[]> => {
      const result = await systemDocumentsRepository.getByProduct(productId);
      // Backend returns a plain array, not paginated
      return Array.isArray(result) ? result : result.data ?? [];
    },
    enabled: !!productId,
  });
}

export function useSystemDocument(docId: string) {
  return useQuery({
    queryKey: ["system-documents", "detail", docId],
    queryFn: (): Promise<SystemDocument> =>
      systemDocumentsRepository.getById(docId),
    enabled: !!docId,
  });
}

export function useDocumentVersions(docId: string) {
  return useQuery({
    queryKey: ["system-documents", "versions", docId],
    queryFn: (): Promise<SystemDocument[]> =>
      systemDocumentsRepository.getVersions(docId),
    enabled: !!docId,
  });
}

export function useGenerateSystemDocs(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourcePath?: string): Promise<GenerateDocsResponse> =>
      systemDocumentsRepository.generate(productId, sourcePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-documents", productId] });
      toast.success("System documents generated");
    },
    onError: (error: Error) => {
      toast.error("Failed to generate docs: " + error.message);
    },
  });
}

export function useRegenerateSystemDocs(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<GenerateDocsResponse> =>
      systemDocumentsRepository.regenerate(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-documents", productId] });
      toast.success("System documents regenerated");
    },
    onError: (error: Error) => {
      toast.error("Failed to regenerate docs: " + error.message);
    },
  });
}
