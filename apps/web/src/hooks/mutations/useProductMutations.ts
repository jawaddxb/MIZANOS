"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Product>): Promise<Product> =>
      productsRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created");
    },
    onError: (error: Error) => {
      toast.error("Failed to create product: " + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Product>): Promise<Product> =>
      productsRepository.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", data.id] });
      queryClient.invalidateQueries({ queryKey: ["product-detail", data.id] });
      toast.success("Product updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update product: " + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> =>
      productsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete product: " + error.message);
    },
  });
}
