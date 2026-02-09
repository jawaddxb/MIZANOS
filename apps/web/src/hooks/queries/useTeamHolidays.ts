"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamRepository } from "@/lib/api/repositories";
import type { TeamHoliday, NationalHoliday } from "@/lib/types";
import { toast } from "sonner";

export function useTeamHolidays(profileId?: string) {
  return useQuery({
    queryKey: ["team-holidays", profileId],
    queryFn: (): Promise<TeamHoliday[]> =>
      teamRepository.getHolidays(profileId),
  });
}

export function useNationalHolidays(location?: string) {
  return useQuery({
    queryKey: ["national-holidays", location],
    queryFn: (): Promise<NationalHoliday[]> =>
      teamRepository.getNationalHolidays(location),
  });
}

export function useCreateTeamHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      profile_id: string;
      start_date: string;
      end_date: string;
      reason?: string;
    }) => teamRepository.createHoliday(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-holidays"] });
      toast.success("Holiday booked successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to book holiday: " + error.message);
    },
  });
}

export function useUpdateTeamHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...updates
    }: {
      id: string;
      start_date?: string;
      end_date?: string;
      reason?: string;
    }) => teamRepository.updateHoliday(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-holidays"] });
      toast.success("Holiday updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update holiday: " + error.message);
    },
  });
}

export function useDeleteTeamHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamRepository.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-holidays"] });
      toast.success("Holiday cancelled");
    },
    onError: (error: Error) => {
      toast.error("Failed to cancel holiday: " + error.message);
    },
  });
}
