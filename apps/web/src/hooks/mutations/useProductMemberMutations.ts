"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { ProductMember } from "@/lib/types";
import { toast } from "sonner";

export function useAddProductMember(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { profile_id: string; role: string }): Promise<ProductMember> =>
      productsRepository.addMember(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-members", productId] });
      queryClient.invalidateQueries({ queryKey: ["team-readiness", productId] });
      toast.success("Member added to project");
    },
    onError: (error: Error) => {
      toast.error("Failed to add member: " + error.message);
    },
  });
}

export function useRemoveProductMember(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string): Promise<void> =>
      productsRepository.removeMember(productId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-members", productId] });
      queryClient.invalidateQueries({ queryKey: ["team-readiness", productId] });
      toast.success("Member removed from project");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove member: " + error.message);
    },
  });
}
