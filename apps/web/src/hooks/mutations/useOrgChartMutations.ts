"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orgChartRepository } from "@/lib/api/repositories";
import type { UpdateReportingLineRequest } from "@/lib/types";
import { toast } from "sonner";

export function useUpdateReportingLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      data,
    }: {
      profileId: string;
      data: UpdateReportingLineRequest;
    }) => orgChartRepository.updateReportingLine(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-chart"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Reporting line updated");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to update reporting line");
    },
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) =>
      orgChartRepository.resendInvite(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-chart"] });
      toast.success("Invitation resent");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to resend invitation");
    },
  });
}
