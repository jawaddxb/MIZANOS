"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import type { OrgSetting } from "@/lib/types";

export function useOrgSettings() {
  return useQuery({
    queryKey: ["org-settings"],
    queryFn: (): Promise<OrgSetting[]> => settingsRepository.getOrgSettings(),
  });
}

export function useShowPendingProfiles(): boolean {
  const { data: settings = [] } = useOrgSettings();
  const setting = settings.find(
    (s) => s.key === "show_pending_profiles_in_assignments",
  );
  return !!(setting?.value as Record<string, unknown>)?.enabled;
}

export function useSendActivationEmailOnInvite(): boolean {
  const { data: settings = [] } = useOrgSettings();
  const setting = settings.find(
    (s) => s.key === "send_activation_email_on_invite",
  );
  return (setting?.value as Record<string, unknown>)?.enabled !== false;
}
