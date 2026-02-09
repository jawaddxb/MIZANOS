"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import type { Stakeholder, StakeholderRole } from "@/lib/types";
import { toast } from "sonner";

interface CreateStakeholderData {
  product_id: string;
  profile_id?: string | null;
  name: string;
  role: StakeholderRole;
  responsibilities?: string[];
  email?: string;
  is_external?: boolean;
}

interface UpdateStakeholderData {
  id: string;
  name?: string;
  role?: StakeholderRole;
  responsibilities?: string[];
  email?: string;
  is_external?: boolean;
  profile_id?: string | null;
}

export function useStakeholderMutations() {
  const queryClient = useQueryClient();

  const createStakeholder = useMutation({
    mutationFn: (data: CreateStakeholderData) =>
      productsRepository.createStakeholder(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stakeholders", variables.product_id],
      });
      toast.success("Stakeholder added");
    },
    onError: (error: Error) => {
      toast.error("Failed to add stakeholder: " + error.message);
    },
  });

  const updateStakeholder = useMutation({
    mutationFn: ({ id, ...data }: UpdateStakeholderData) =>
      productsRepository.updateStakeholder(id, data as Partial<Stakeholder>),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["stakeholders", data.product_id],
      });
      toast.success("Stakeholder updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update stakeholder: " + error.message);
    },
  });

  const deleteStakeholder = useMutation({
    mutationFn: ({ id }: { id: string; productId: string }) =>
      productsRepository.deleteStakeholder(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stakeholders", variables.productId],
      });
      toast.success("Stakeholder removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove stakeholder: " + error.message);
    },
  });

  return { createStakeholder, updateStakeholder, deleteStakeholder };
}
