"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import type { OrgSetting } from "@/lib/types";
import { toast } from "sonner";

export function useUpdateOrgSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      value,
    }: {
      key: string;
      value: Record<string, unknown>;
    }): Promise<OrgSetting> => settingsRepository.updateOrgSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
      toast.success("Organization setting updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update setting: " + error.message);
    },
  });
}
