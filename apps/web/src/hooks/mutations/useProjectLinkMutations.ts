"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import { toast } from "sonner";

export function useCreateProjectLink(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; url: string }) =>
      productsRepository.createLink(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-links", productId] });
      toast.success("Link added");
    },
    onError: () => toast.error("Failed to add link"),
  });
}

export function useUpdateProjectLink(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ linkId, data }: { linkId: string; data: { name?: string; url?: string } }) =>
      productsRepository.updateLink(productId, linkId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-links", productId] });
      toast.success("Link updated");
    },
    onError: () => toast.error("Failed to update link"),
  });
}

export function useDeleteProjectLink(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => productsRepository.deleteLink(productId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-links", productId] });
      toast.success("Link removed");
    },
    onError: () => toast.error("Failed to remove link"),
  });
}
