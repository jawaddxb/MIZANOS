"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { specificationsRepository } from "@/lib/api/repositories";
import type { SpecificationFeature } from "@/lib/types";
import { toast } from "sonner";

export function useCreateSpecFeature(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SpecificationFeature>) =>
      specificationsRepository.createFeature({ ...data, product_id: productId } as Partial<SpecificationFeature> & { product_id: string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specification-features", productId] });
      toast.success("Feature added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSpecFeature(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<SpecificationFeature>) =>
      specificationsRepository.updateFeature(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specification-features", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSpecFeature(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (featureId: string) =>
      specificationsRepository.deleteFeature(featureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specification-features", productId] });
      toast.success("Feature removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
