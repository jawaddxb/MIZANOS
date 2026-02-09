"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { marketingRepository } from "@/lib/api/repositories";
import type { MarketingDomain, MarketingSocialHandle } from "@/lib/types";
import { toast } from "sonner";

export function useDomainMutations(productId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["marketing-domains", productId] });

  const createDomain = useMutation({
    mutationFn: (data: Partial<MarketingDomain>): Promise<MarketingDomain> =>
      marketingRepository.createDomain({ ...data, product_id: productId }),
    onSuccess: () => { invalidate(); toast.success("Domain added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateDomain = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<MarketingDomain>) =>
      marketingRepository.updateDomain(id, data),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteDomain = useMutation({
    mutationFn: (id: string) => marketingRepository.deleteDomain(id),
    onSuccess: () => { invalidate(); toast.success("Domain removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createDomain, updateDomain, deleteDomain };
}

export function useSocialHandleMutations(productId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["marketing-social-handles", productId] });

  const createHandle = useMutation({
    mutationFn: (data: Partial<MarketingSocialHandle>) =>
      marketingRepository.createSocialHandle({ ...data, product_id: productId }),
    onSuccess: () => { invalidate(); toast.success("Social handle added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateHandle = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<MarketingSocialHandle>) =>
      marketingRepository.updateSocialHandle(id, data),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteHandle = useMutation({
    mutationFn: (id: string) => marketingRepository.deleteSocialHandle(id),
    onSuccess: () => { invalidate(); toast.success("Social handle removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createHandle, updateHandle, deleteHandle };
}

export function useChecklistMutations(productId: string) {
  const queryClient = useQueryClient();

  const toggleItem = useMutation({
    mutationFn: ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) =>
      marketingRepository.toggleChecklistItem(itemId, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-checklist", productId] });
    },
  });

  return { toggleItem };
}
