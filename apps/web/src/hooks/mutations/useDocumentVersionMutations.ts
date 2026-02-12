"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsRepository } from "@/lib/api/repositories";
import { apiClient } from "@/lib/api/client";
import type { DocumentVersion } from "@/lib/types";
import { toast } from "sonner";

const QUERY_KEY = "document-versions";

export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, documentId],
    queryFn: (): Promise<DocumentVersion[]> =>
      documentsRepository.getVersions(documentId),
    enabled: !!documentId,
  });
}

export function useRestoreVersion(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await apiClient.post(
        `/documents/${documentId}/versions/${versionId}/restore`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, documentId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Version restored");
    },
    onError: (e: Error) => toast.error("Failed to restore version: " + e.message),
  });
}
