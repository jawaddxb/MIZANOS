"use client";

import { ShieldAlert } from "lucide-react";
import { useOrgSettings, useAiDefaults } from "@/hooks/queries/useOrgSettings";
import { useUpdateOrgSetting } from "@/hooks/mutations/useOrgSettingMutations";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { AIConfigSection } from "./AIConfigSection";

export function AIConfigTab() {
  const { data: settings = [], isLoading } = useOrgSettings();
  const { data: defaults } = useAiDefaults();
  const updateSetting = useUpdateOrgSetting();
  const { isSuperAdmin, isLoading: rolesLoading } = useRoleVisibility();

  if (isLoading || rolesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <ShieldAlert className="h-10 w-10" />
        <p className="text-sm font-medium">Super Admin access required</p>
        <p className="text-xs">
          Only Super Admins can view and modify AI configuration settings.
        </p>
      </div>
    );
  }

  return (
    <AIConfigSection
      settings={settings}
      defaults={defaults ?? null}
      isPending={updateSetting.isPending}
    />
  );
}
