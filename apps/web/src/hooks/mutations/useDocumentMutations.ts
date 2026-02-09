"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsRepository } from "@/lib/api/repositories";
import type { ProductDocument } from "@/lib/types";
import { toast } from "sonner";

export function useUploadDocument(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ProductDocument>): Promise<ProductDocument> =>
      documentsRepository.create({ ...data, product_id: productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", productId] });
      toast.success("Document uploaded");
    },
    onError: (error: Error) => {
      toast.error("Failed to upload document: " + error.message);
    },
  });
}

export function useDeleteDocument(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string): Promise<void> =>
      documentsRepository.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", productId] });
      toast.success("Document deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });
}
