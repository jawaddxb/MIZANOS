"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { specificationsRepository } from "@/lib/api/repositories";
import type { SpecificationFeature, FeaturePriority } from "@/lib/types";
import { toast } from "sonner";

export function useCreateSpecFeature(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feature: {
      name: string;
      description?: string;
      priority: FeaturePriority;
      acceptance_criteria?: string[];
      specification_id?: string;
    }) =>
      specificationsRepository.createFeature({
        product_id: productId,
        name: feature.name,
        description: feature.description ?? null,
        priority: feature.priority,
        acceptance_criteria: feature.acceptance_criteria ?? null,
        specification_id: feature.specification_id ?? null,
        status: "pending",
        sort_order: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["specification-features", productId],
      });
      toast.success("Feature added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add feature");
    },
  });
}

export function useUpdateSpecFeature(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...updates
    }: Partial<SpecificationFeature> & { id: string }) =>
      specificationsRepository.updateFeature(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["specification-features", productId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update feature");
    },
  });
}

export function useDeleteSpecFeature(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => specificationsRepository.deleteFeature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["specification-features", productId],
      });
      toast.success("Feature removed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove feature");
    },
  });
}
