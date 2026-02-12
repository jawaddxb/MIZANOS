"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

export function useRenameFolder(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ folderId, name }: { folderId: string; name: string }) => {
      const response = await apiClient.patch(
        `/products/${productId}/document-folders/${folderId}`,
        { name },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders", productId] });
      toast.success("Folder renamed");
    },
    onError: (e: Error) => toast.error("Failed to rename folder: " + e.message),
  });
}

export function useMoveFolder(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ folderId, newParentId }: { folderId: string; newParentId: string | null }) => {
      const response = await apiClient.patch(
        `/products/${productId}/document-folders/${folderId}`,
        { parent_id: newParentId },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders", productId] });
      toast.success("Folder moved");
    },
    onError: (e: Error) => toast.error("Failed to move folder: " + e.message),
  });
}

export function useMoveDocument(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, folderId }: { documentId: string; folderId: string | null }) => {
      const response = await apiClient.patch(
        `/documents/${documentId}`,
        { folder_id: folderId },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", productId] });
      toast.success("Document moved");
    },
    onError: (e: Error) => toast.error("Failed to move document: " + e.message),
  });
}

export function useDeleteFolder(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderId: string) => {
      await apiClient.delete(`/products/${productId}/document-folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders", productId] });
      toast.success("Folder deleted");
    },
    onError: (e: Error) => toast.error("Failed to delete folder: " + e.message),
  });
}
