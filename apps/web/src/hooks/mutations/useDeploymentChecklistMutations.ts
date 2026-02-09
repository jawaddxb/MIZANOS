"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import { toast } from "sonner";

export function useSeedChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => productsRepository.seedChecklist(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({
        queryKey: ["deployment-checklist", productId],
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to seed checklist: " + error.message);
    },
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isChecked,
    }: {
      id: string;
      isChecked: boolean;
      productId: string;
    }) => productsRepository.toggleChecklistItem(id, isChecked),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deployment-checklist", variables.productId],
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update checklist: " + error.message);
    },
  });
}

export function useUpdateChecklistNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      notes,
    }: {
      id: string;
      notes: string;
      productId: string;
    }) => productsRepository.updateChecklistNotes(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deployment-checklist", variables.productId],
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update notes: " + error.message);
    },
  });
}
