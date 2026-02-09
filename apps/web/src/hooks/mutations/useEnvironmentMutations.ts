"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { ProductEnvironment, EnvironmentType } from "@/lib/types";
import { toast } from "sonner";

export function useUpsertEnvironment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Partial<ProductEnvironment> & {
        product_id: string;
        environment_type: EnvironmentType;
      },
    ) => productsRepository.upsertEnvironment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-environments", variables.product_id],
      });
      toast.success("Environment updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update environment: " + error.message);
    },
  });
}

export function useDeleteEnvironment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      envType,
    }: {
      productId: string;
      envType: EnvironmentType;
    }) => productsRepository.deleteEnvironment(productId, envType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-environments", variables.productId],
      });
      toast.success("Environment removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove environment: " + error.message);
    },
  });
}
