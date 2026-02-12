"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamRepository } from "@/lib/api/repositories";
import type { NationalHoliday } from "@/lib/types";
import { toast } from "sonner";

export function useCreateNationalHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      date: string;
      location: string;
      recurring: boolean;
    }) => teamRepository.createNationalHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "national-holidays"] });
      toast.success("National holiday created");
    },
    onError: () => {
      toast.error("Failed to create national holiday");
    },
  });
}

export function useUpdateNationalHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<NationalHoliday>;
    }) => teamRepository.updateNationalHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "national-holidays"] });
      toast.success("National holiday updated");
    },
    onError: () => {
      toast.error("Failed to update national holiday");
    },
  });
}

export function useDeleteNationalHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamRepository.deleteNationalHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "national-holidays"] });
      toast.success("National holiday deleted");
    },
    onError: () => {
      toast.error("Failed to delete national holiday");
    },
  });
}
