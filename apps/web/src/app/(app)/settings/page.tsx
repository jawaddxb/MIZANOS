"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/queries/useProfiles";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";
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
const ComponentLibraryTab = dynamic(() => import("@/components/organisms/settings/ComponentLibraryTab").then((m) => ({ default: m.ComponentLibraryTab })), { loading: () => <TabSkeleton /> });
const WorkflowRulesTab = dynamic(() => import("@/components/organisms/settings/WorkflowRulesTab").then((m) => ({ default: m.WorkflowRulesTab })), { loading: () => <TabSkeleton /> });

const ALL_TABS = [
  { id: "profile", label: "Profile", adminOnly: false },
  { id: "standards", label: "Standards", adminOnly: false },
  { id: "modules", label: "Modules", adminOnly: false },
  { id: "integrations", label: "Integrations", adminOnly: false },
  { id: "notifications", label: "Notifications", adminOnly: false },
  { id: "holidays", label: "Holidays", adminOnly: false },
  { id: "library", label: "Library", adminOnly: false },
  { id: "users", label: "Users", adminOnly: true },
  { id: "authority-matrix", label: "Authority Matrix", adminOnly: true },
  { id: "workflow", label: "Workflow", adminOnly: true },
] as const;

type TabId = (typeof ALL_TABS)[number]["id"];

function TabSkeleton() {
  return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-10 w-full" /></div>;
}

const TAB_COMPONENTS: Partial<Record<TabId, React.ComponentType>> = {
  profile: ProfileTab,
  users: UserManagementTab,
  "authority-matrix": PermissionMatrixTab,
  modules: ModulesTab,
  integrations: IntegrationsTab,
  notifications: NotificationsTab,
  library: ComponentLibraryTab,
  workflow: WorkflowRulesTab,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const { isAdmin } = useRoleVisibility();

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((tab) => !tab.adminOnly || isAdmin),
    [isAdmin],
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure system preferences, standards, and integrations
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
