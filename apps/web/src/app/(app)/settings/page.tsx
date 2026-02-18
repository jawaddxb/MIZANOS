"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PageHeader } from "@/components/molecules/layout/PageHeader";
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
import type { Profile, Module, StandardsRepository as StandardsRepoType } from "@/lib/types";

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
const GitHubPatsTab = dynamic(() => import("@/components/organisms/settings/GitHubPatsTab").then((m) => ({ default: m.GitHubPatsTab })), { loading: () => <TabSkeleton /> });
const OrgSettingsTab = dynamic(() => import("@/components/organisms/settings/OrgSettingsTab").then((m) => ({ default: m.OrgSettingsTab })), { loading: () => <TabSkeleton /> });

const InviteUserDialog = dynamic(() => import("@/components/organisms/settings/InviteUserDialog").then((m) => ({ default: m.InviteUserDialog })));
const UserPermissionsDialog = dynamic(() => import("@/components/organisms/settings/UserPermissionsDialog").then((m) => ({ default: m.UserPermissionsDialog })));
const ResetPasswordDialog = dynamic(() => import("@/components/organisms/settings/ResetPasswordDialog").then((m) => ({ default: m.ResetPasswordDialog })));
const UserOverridesPanel = dynamic(() => import("@/components/organisms/settings/UserOverridesPanel").then((m) => ({ default: m.UserOverridesPanel })));
const AddOverrideDialog = dynamic(() => import("@/components/organisms/settings/AddOverrideDialog").then((m) => ({ default: m.AddOverrideDialog })));
const PermissionAuditLog = dynamic(() => import("@/components/organisms/settings/PermissionAuditLog").then((m) => ({ default: m.PermissionAuditLog })));
const NationalHolidaysManagement = dynamic(() => import("@/components/organisms/settings/NationalHolidaysManagement").then((m) => ({ default: m.NationalHolidaysManagement })));
const TeamCalendarView = dynamic(() => import("@/components/organisms/settings/TeamCalendarView").then((m) => ({ default: m.TeamCalendarView })));
const CreateModuleDialog = dynamic(() => import("@/components/organisms/settings/CreateModuleDialog").then((m) => ({ default: m.CreateModuleDialog })));
const EditModuleDialog = dynamic(() => import("@/components/organisms/settings/EditModuleDialog").then((m) => ({ default: m.EditModuleDialog })));
const AddGlobalIntegrationDialog = dynamic(() => import("@/components/organisms/settings/AddGlobalIntegrationDialog").then((m) => ({ default: m.AddGlobalIntegrationDialog })));
const EditStandardsRepositoryDialog = dynamic(() => import("@/components/organisms/settings/EditStandardsRepositoryDialog").then((m) => ({ default: m.EditStandardsRepositoryDialog })));
const AddPatDialog = dynamic(() => import("@/components/organisms/settings/AddPatDialog").then((m) => ({ default: m.AddPatDialog })));

const ALL_TABS = [
  { id: "profile", label: "Profile" },
  { id: "standards", label: "Standards" },
  { id: "modules", label: "Modules" },
  { id: "integrations", label: "Integrations" },
  { id: "github-pats", label: "GitHub PATs" },
  { id: "notifications", label: "Notifications" },
  { id: "holidays", label: "Holidays" },
  { id: "library", label: "Library" },
  { id: "users", label: "Users", adminOnly: true as const },
  { id: "authority-matrix", label: "Authority Matrix", adminOnly: true as const },
  { id: "workflow", label: "Workflow", adminOnly: true as const },
  { id: "org-settings", label: "Organization", superadminOnly: true as const },
] as const;

type TabId = (typeof ALL_TABS)[number]["id"];

function TabSkeleton() {
  return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-10 w-full" /></div>;
}

const TAB_COMPONENTS: Partial<Record<TabId, React.ComponentType>> = {
  profile: ProfileTab,
  notifications: NotificationsTab,
  library: ComponentLibraryTab,
  workflow: WorkflowRulesTab,
  "org-settings": OrgSettingsTab,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const { isAdmin, isSuperAdmin } = useRoleVisibility();

  const visibleTabs = useMemo(
    () =>
      ALL_TABS.filter((tab) => {
        if ("superadminOnly" in tab) return isSuperAdmin;
        return !("adminOnly" in tab) || isAdmin;
      }),
    [isAdmin, isSuperAdmin],
  );

  const isElevated = (t: (typeof ALL_TABS)[number]) => "adminOnly" in t || "superadminOnly" in t;
  const generalTabs = visibleTabs.filter((t) => !isElevated(t));
  const adminTabs = visibleTabs.filter(isElevated);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure system preferences, standards, and integrations"
        icon={<Settings className="h-5 w-5 text-primary" />}
      />

      <div className="border-b border-border -mx-6 px-6 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1">
          {generalTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-t" />
              )}
            </button>
          ))}
          {adminTabs.length > 0 && (
            <>
              <span className="mx-1 h-4 w-px bg-border" />
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-t" />
                  )}
                </button>
              ))}
            </>
          )}
        </nav>
      </div>

      <div className="min-h-[400px]">
          {activeTab === "standards" ? (
            <StandardsTabWrapper />
          ) : activeTab === "holidays" ? (
            <HolidaysTabWrapper />
          ) : activeTab === "users" ? (
            <UserManagementTabWrapper />
          ) : activeTab === "authority-matrix" ? (
            <PermissionMatrixTabWrapper />
          ) : activeTab === "modules" ? (
            <ModulesTabWrapper />
          ) : activeTab === "integrations" ? (
            <IntegrationsTabWrapper />
          ) : activeTab === "github-pats" ? (
            <GitHubPatsTabWrapper />
          ) : (
            <GenericSettingsTab tabId={activeTab} />
          )}
      </div>
    </div>
  );
}
function UserManagementTabWrapper() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [permissionsProfile, setPermissionsProfile] = useState<Profile | null>(null);
  const [resetProfile, setResetProfile] = useState<Profile | null>(null);

  return (
    <>
      <UserManagementTab
        onInviteUser={() => setInviteOpen(true)}
        onViewPermissions={(profile) => setPermissionsProfile(profile)}
        onResetPassword={(profile) => setResetProfile(profile)}
      />
      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <UserPermissionsDialog
        open={!!permissionsProfile}
        onOpenChange={(open) => !open && setPermissionsProfile(null)}
        profile={permissionsProfile}
      />
      <ResetPasswordDialog
        open={!!resetProfile}
        onOpenChange={(open) => !open && setResetProfile(null)}
        profile={resetProfile}
      />
    </>
  );
}
function PermissionMatrixTabWrapper() {
  const [addOverrideOpen, setAddOverrideOpen] = useState(false);

  return (
    <>
      <PermissionMatrixTab
        overridesPanel={
          <UserOverridesPanel onAddOverride={() => setAddOverrideOpen(true)} />
        }
        auditLogPanel={<PermissionAuditLog />}
      />
      <AddOverrideDialog open={addOverrideOpen} onOpenChange={setAddOverrideOpen} />
    </>
  );
}
function ModulesTabWrapper() {
  const { isAdmin } = useRoleVisibility();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  return (
    <>
      <ModulesTab
        isAdmin={isAdmin}
        onCreateModule={() => setCreateOpen(true)}
        onEditModule={(mod) => setEditingModule(mod)}
      />
      <CreateModuleDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditModuleDialog
        open={!!editingModule}
        onOpenChange={(open) => !open && setEditingModule(null)}
        module={editingModule}
      />
    </>
  );
}
function IntegrationsTabWrapper() {
  const { isAdmin } = useRoleVisibility();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <IntegrationsTab isAdmin={isAdmin} onAddIntegration={() => setAddOpen(true)} />
      <AddGlobalIntegrationDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
function StandardsTabWrapper() {
  const { data: repositories = [], isLoading } = useStandardsRepositories();
  const createRepo = useCreateStandardsRepository();
  const updateRepo = useUpdateStandardsRepository();
  const deleteRepo = useDeleteStandardsRepository();
  const [editingRepo, setEditingRepo] = useState<StandardsRepoType | null>(null);

  return (
    <>
      <StandardsTab
        repositories={repositories}
        isLoading={isLoading}
        onCreate={async (data) => { createRepo.mutateAsync(data); }}
        onToggle={(id, isActive) => updateRepo.mutate({ id, updates: { is_active: isActive } })}
        onDelete={(id) => deleteRepo.mutate(id)}
        onEdit={(repo) => setEditingRepo(repo as unknown as StandardsRepoType)}
      />
      <EditStandardsRepositoryDialog
        open={!!editingRepo}
        onOpenChange={(open) => !open && setEditingRepo(null)}
        repository={editingRepo}
      />
    </>
  );
}

function HolidaysTabWrapper() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id ?? "");
  const { isAdmin } = useRoleVisibility();

  return (
    <HolidaysTab
      currentProfile={profile ?? null}
      isAdmin={isAdmin}
      calendarView={
        <TeamCalendarView
          profileId={profile?.id}
          officeLocation={profile?.office_location ?? undefined}
        />
      }
      nationalManagement={<NationalHolidaysManagement />}
    />
  );
}

function GitHubPatsTabWrapper() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <GitHubPatsTab onAddPat={() => setAddOpen(true)} />
      <AddPatDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}

function GenericSettingsTab({ tabId }: { tabId: TabId }) {
  const Comp = TAB_COMPONENTS[tabId];
  return Comp ? <Comp /> : null;
}
