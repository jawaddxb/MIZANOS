"use client";

import { useMemo, useState } from "react";
import { Network, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { PageHeader } from "@/components/molecules/layout/PageHeader";
import { OrgChartTree } from "@/components/organisms/org-chart/OrgChartTree";
import { ChangeManagerDialog } from "@/components/organisms/org-chart/ChangeManagerDialog";
import { InviteUserDialog } from "@/components/organisms/settings/InviteUserDialog";
import { useOrgChart } from "@/hooks/queries/useOrgChart";
import { useUpdateReportingLine, useResendInvite } from "@/hooks/mutations/useOrgChartMutations";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";
import type { OrgChartNode } from "@/lib/types";

export default function OrgChartPage() {
  const { data: nodes, isLoading } = useOrgChart();
  const { isSuperAdmin, isAdmin, isPM } = useRoleVisibility();
  const updateLine = useUpdateReportingLine();
  const resendInvite = useResendInvite();

  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<OrgChartNode | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const canInvite = isAdmin || isPM;

  const managerOptions = useMemo(
    () =>
      (nodes ?? [])
        .filter((n) => n.status === "active")
        .map((n) => ({ value: n.id, label: n.full_name ?? n.email ?? n.id })),
    [nodes],
  );

  const handleEditManager = (node: OrgChartNode) => {
    setSelectedNode(node);
    setManagerDialogOpen(true);
  };

  const handleConfirmManager = (profileId: string, managerId: string | null) => {
    updateLine.mutate(
      { profileId, data: { manager_id: managerId } },
      { onSuccess: () => setManagerDialogOpen(false) },
    );
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Organization Chart"
        subtitle="Team structure and reporting lines"
        icon={<Network className="h-5 w-5 text-primary" />}
      >
        {canInvite && (
          <BaseButton onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </BaseButton>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4 py-8">
          <Skeleton className="h-32 w-64 mx-auto" />
          <div className="flex justify-center gap-8">
            <Skeleton className="h-32 w-48" />
            <Skeleton className="h-32 w-48" />
            <Skeleton className="h-32 w-48" />
          </div>
        </div>
      ) : (
        <OrgChartTree
          nodes={nodes ?? []}
          canResendInvite={isAdmin || isPM}
          canEditHierarchy={isSuperAdmin}
          onResendInvite={(id) => resendInvite.mutate(id)}
          onEditManager={handleEditManager}
        />
      )}

      <ChangeManagerDialog
        open={managerDialogOpen}
        onOpenChange={setManagerDialogOpen}
        targetNode={selectedNode}
        allNodes={nodes ?? []}
        onConfirm={handleConfirmManager}
        isPending={updateLine.isPending}
      />

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        managerOptions={managerOptions}
      />
    </div>
  );
}
