"use client";

import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { useOrgSettings } from "@/hooks/queries/useOrgSettings";
import { useUpdateOrgSetting } from "@/hooks/mutations/useOrgSettingMutations";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import type { OrgSetting } from "@/lib/types";

interface OrgSettingToggleProps {
  id: string;
  label: string;
  description: string;
  settingKey: string;
  settings: OrgSetting[];
  isPending: boolean;
  onToggle: (key: string, checked: boolean) => void;
}

function OrgSettingToggle({
  id,
  label,
  description,
  settingKey,
  settings,
  isPending,
  onToggle,
}: OrgSettingToggleProps) {
  const setting = settings.find((s) => s.key === settingKey);
  const enabled = !!(setting?.value as Record<string, unknown>)?.enabled;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <BaseLabel htmlFor={id}>{label}</BaseLabel>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <BaseSwitch
          id={id}
          checked={enabled}
          onCheckedChange={(checked: boolean) => onToggle(settingKey, checked)}
          disabled={isPending}
        />
      </div>
    </div>
  );
}

export function OrgSettingsTab() {
  const { data: settings = [], isLoading } = useOrgSettings();
  const updateSetting = useUpdateOrgSetting();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const handleToggle = (key: string, checked: boolean) => {
    updateSetting.mutate({ key, value: { enabled: checked } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Organization Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure organization-wide behavior and policies.
        </p>
      </div>

      <OrgSettingToggle
        id="pending-profiles-toggle"
        label="Show pending profiles in assignments"
        description="When enabled, users who haven't completed activation will appear in task assignee and project team member dropdowns."
        settingKey="show_pending_profiles_in_assignments"
        settings={settings}
        isPending={updateSetting.isPending}
        onToggle={handleToggle}
      />

      <OrgSettingToggle
        id="activation-email-toggle"
        label="Send activation email on invite"
        description="When enabled, an activation email is automatically sent when inviting new users. Disabling this creates the account without sending email. Manual resend is always available."
        settingKey="send_activation_email_on_invite"
        settings={settings}
        isPending={updateSetting.isPending}
        onToggle={handleToggle}
      />
    </div>
  );
}
