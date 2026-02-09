"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qaRepository } from "@/lib/api/repositories";
import type { QACheck } from "@/lib/types";
import { toast } from "sonner";

export function useToggleQACheck(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      checkId,
      status,
    }: {
      checkId: string;
      status: string;
    }): Promise<QACheck> => qaRepository.toggleCheck(checkId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa-checks", productId] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update QA check: " + error.message);
    },
  });
}

export function useCreateQACheck(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      category: string;
      description?: string;
      product_id: string;
    }): Promise<QACheck> => qaRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa-checks", productId] });
      toast.success("QA check created");
    },
    onError: (error: Error) => {
      toast.error("Failed to create QA check: " + error.message);
    },
  });
}

export function useUpdateQANotes(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      checkId,
      notes,
    }: {
      checkId: string;
      notes: string;
    }): Promise<QACheck> => qaRepository.updateNotes(checkId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa-checks", productId] });
    },
  });
}
