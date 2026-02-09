"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/queries/useProfiles";
import {
  useStandardsRepositories,
  useCreateStandardsRepository,
  useUpdateStandardsRepository,
  useDeleteStandardsRepository,
} from "@/hooks/queries/useStandardsRepositories";

const ProfileTab = dynamic(() => import("@/components/organisms/settings/ProfileTab").then((m) => ({ default: m.ProfileTab })), { loading: () => <TabSkeleton /> });
const UserManagementTab = dynamic(() => import("@/components/organisms/settings/UserManagementTab").then((m) => ({ default: m.UserManagementTab })), { loading: () => <TabSkeleton /> });
const PermissionMatrixTab = dynamic(() => import("@/components/organisms/settings/PermissionMatrixTab").then((m) => ({ default: m.PermissionMatrixTab })), { loading: () => <TabSkeleton /> });
const ModulesTab = dynamic(() => import("@/components/organisms/settings/ModulesTab").then((m) => ({ default: m.ModulesTab })), { loading: () => <TabSkeleton /> });
const IntegrationsTab = dynamic(() => import("@/components/organisms/settings/IntegrationsTab").then((m) => ({ default: m.IntegrationsTab })), { loading: () => <TabSkeleton /> });
const NotificationsTab = dynamic(() => import("@/components/organisms/settings/NotificationsTab").then((m) => ({ default: m.NotificationsTab })), { loading: () => <TabSkeleton /> });
const StandardsTab = dynamic(() => import("@/components/organisms/settings/StandardsTab").then((m) => ({ default: m.StandardsTab })), { loading: () => <TabSkeleton /> });
const HolidaysTab = dynamic(() => import("@/components/organisms/settings/HolidaysTab").then((m) => ({ default: m.HolidaysTab })), { loading: () => <TabSkeleton /> });

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "users", label: "Users" },
  { id: "permissions", label: "Permissions" },
  { id: "modules", label: "Modules" },
  { id: "integrations", label: "Integrations" },
  { id: "notifications", label: "Notifications" },
  { id: "standards", label: "Standards" },
  { id: "holidays", label: "Holidays" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function TabSkeleton() {
  return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-10 w-full" /></div>;
}

const TAB_COMPONENTS: Partial<Record<TabId, React.ComponentType>> = {
  profile: ProfileTab,
  users: UserManagementTab,
  permissions: PermissionMatrixTab,
  modules: ModulesTab,
  integrations: IntegrationsTab,
  notifications: NotificationsTab,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === "standards" ? (
          <StandardsTabWrapper />
        ) : activeTab === "holidays" ? (
          <HolidaysTabWrapper />
        ) : (
          <GenericSettingsTab tabId={activeTab} />
        )}
      </div>
    </div>
  );
}

function StandardsTabWrapper() {
  const { data: repositories = [], isLoading } = useStandardsRepositories();
  const createRepo = useCreateStandardsRepository();
  const updateRepo = useUpdateStandardsRepository();
  const deleteRepo = useDeleteStandardsRepository();

  return (
    <StandardsTab
      repositories={repositories}
      isLoading={isLoading}
      onCreate={async (data) => { createRepo.mutateAsync(data); }}
      onToggle={(id, isActive) => updateRepo.mutate({ id, updates: { is_active: isActive } })}
      onDelete={(id) => deleteRepo.mutate(id)}
    />
  );
}

function HolidaysTabWrapper() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id ?? "");

  return <HolidaysTab currentProfile={profile ?? null} />;
}

function GenericSettingsTab({ tabId }: { tabId: TabId }) {
  const Component = TAB_COMPONENTS[tabId];
  if (!Component) return null;
  return <Component />;
}
