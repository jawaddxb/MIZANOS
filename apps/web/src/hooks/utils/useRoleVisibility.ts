"use client";

import { useMyPermissions } from "@/hooks/queries/usePermissions";
import type { FeatureKey } from "@/lib/types";

export function useRoleVisibility() {
  const { hasPermission, isLoading, userRoles } = useMyPermissions();

  const isAdmin = userRoles.includes("admin");
  const isPM = userRoles.includes("pm");
  const isMarketing = userRoles.includes("marketing");
  const isEngineer = userRoles.includes("engineer");
  const isBizDev = userRoles.includes("bizdev");

  const canViewMarketingTab = hasPermission("marketing_tab");
  const canViewMarketingCredentials = hasPermission("marketing_credentials");
  const canViewManagementNotes = hasPermission("management_notes");
  const canManageTeam = hasPermission("team_manage");
  const canManageSettings = hasPermission("settings_access");
  const canViewAudit = hasPermission("audit_view");
  const canViewQA = hasPermission("qa_manage");
  const canViewDocuments = hasPermission("documents_view");
  const canViewEnvironments = hasPermission("environments_view");
  const canAssignTasks = hasPermission("kanban_edit");

  const canCreateProduct = hasPermission("intake_access");
  const canEditProduct = hasPermission("specification_edit");
  const canDeleteProduct = isAdmin;

  const canViewIntake = hasPermission("intake_access");
  const canViewDashboard = hasPermission("dashboard_view");
  const canViewProjectOverview = hasPermission("project_overview");
  const canViewSources = hasPermission("sources_tab");
  const canViewKanban = hasPermission("kanban_view");
  const canEditKanban = hasPermission("kanban_edit");
  const canViewSpecification = hasPermission("specification_view");
  const canEditSpecification = hasPermission("specification_edit");
  const canEditDocuments = hasPermission("documents_edit");
  const canViewPartnerNotes = hasPermission("partner_notes");
  const canManageStakeholders = hasPermission("stakeholders_manage");
  const canViewTeam = hasPermission("team_view");
  const canManageRoles = hasPermission("role_management");
  const canManageWorkflow = hasPermission("workflow_rules");

  const primaryRole = isAdmin
    ? "admin"
    : isPM
      ? "pm"
      : isMarketing
        ? "marketing"
        : isBizDev
          ? "bizdev"
          : isEngineer
            ? "engineer"
            : null;

  return {
    isLoading,
    roles: userRoles,
    userRoles,
    isAdmin,
    isPM,
    isMarketing,
    isEngineer,
    isBizDev,
    primaryRole,
    canViewMarketingTab,
    canViewMarketingCredentials,
    canViewManagementNotes,
    canManageTeam,
    canManageSettings,
    canViewAudit,
    canViewQA,
    canViewDocuments,
    canViewEnvironments,
    canCreateProduct,
    canEditProduct,
    canDeleteProduct,
    canAssignTasks,
    canViewIntake,
    canViewDashboard,
    canViewProjectOverview,
    canViewSources,
    canViewKanban,
    canEditKanban,
    canViewSpecification,
    canEditSpecification,
    canEditDocuments,
    canViewPartnerNotes,
    canManageStakeholders,
    canViewTeam,
    canManageRoles,
    canManageWorkflow,
    hasPermission: hasPermission as (featureKey: FeatureKey) => boolean,
  };
}
