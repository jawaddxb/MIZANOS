"use client";

import { useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { notificationsRepository } from "@/lib/api/repositories";
import type { NotificationPreference } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface NotificationsTabProps {
  className?: string;
}

interface NotificationSetting {
  key: keyof Omit<NotificationPreference, "id" | "user_id" | "created_at" | "updated_at">;
  label: string;
  desc: string;
}

const IN_APP_SETTINGS: NotificationSetting[] = [
  {
    key: "task_assignment",
    label: "Task assignments",
    desc: "When you're assigned to a project or task",
  },
  {
    key: "audit_alerts",
    label: "Audit alerts",
    desc: "When health checks detect issues",
  },
  {
    key: "deadline_reminders",
    label: "Deadline reminders",
    desc: "Upcoming deadlines and overdue items",
  },
  {
    key: "status_changes",
    label: "Status changes",
    desc: "When project status changes",
  },
];

const EMAIL_SETTINGS: NotificationSetting[] = [
  {
    key: "email_digest",
    label: "Daily digest",
    desc: "Summary of activity sent each morning",
  },
  {
    key: "critical_alerts",
    label: "Critical alerts",
    desc: "Immediate email for critical issues",
  },
];

function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => notificationsRepository.getPreferences(),
  });
}

function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotificationPreference>) =>
      notificationsRepository.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
    },
  });
}

function SettingRow({
  setting,
  checked,
  disabled,
  onToggle,
}: {
  setting: NotificationSetting;
  checked: boolean;
  disabled: boolean;
  onToggle: (key: NotificationSetting["key"], value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{setting.label}</p>
        <p className="text-xs text-muted-foreground">{setting.desc}</p>
      </div>
      <BaseSwitch
        checked={checked}
        onCheckedChange={(value) => onToggle(setting.key, value)}
        disabled={disabled}
      />
    </div>
  );
}

export function NotificationsTab({ className }: NotificationsTabProps) {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdatePreferences();

  const handleToggle = useCallback(
    (key: NotificationSetting["key"], checked: boolean) => {
      updateMutation.mutate({ [key]: checked });
    },
    [updateMutation],
  );

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold">In-App Notifications</h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold">In-App Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Configure which notifications you receive
            </p>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {IN_APP_SETTINGS.map((item) => (
              <SettingRow
                key={item.key}
                setting={item}
                checked={preferences?.[item.key] ?? true}
                disabled={updateMutation.isPending}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold">Email Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Configure email preferences
            </p>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {EMAIL_SETTINGS.map((item) => (
              <SettingRow
                key={item.key}
                setting={item}
                checked={preferences?.[item.key] ?? false}
                disabled={updateMutation.isPending}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
