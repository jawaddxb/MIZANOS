"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Network, UserPlus, List, LayoutGrid, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { PageHeader } from "@/components/molecules/layout/PageHeader";
import { ChangeManagerDialog } from "@/components/organisms/org-chart/ChangeManagerDialog";

const OrgChartTree = dynamic(
  () => import("@/components/organisms/org-chart/OrgChartTree").then((m) => m.OrgChartTree),
  { ssr: false },
);
import { AddTeamMemberDialog } from "@/components/organisms/team/AddTeamMemberDialog";
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
  const [showDetails, setShowDetails] = useState(true);
  const [cardsMoved, setCardsMoved] = useState(false);

  useEffect(() => {
    const onDrag = () => setCardsMoved(true);
    window.addEventListener("org-chart-drag", onDrag);
    return () => window.removeEventListener("org-chart-drag", onDrag);
  }, []);

  const handleReset = useCallback(() => {
    window.dispatchEvent(new Event("org-chart-reset"));
    setCardsMoved(false);
  }, []);

  const canInvite = isAdmin || isPM;

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
    <div className="p-6 relative">
      <PageHeader
        title="Organization Chart"
        subtitle="Team structure and reporting lines"
        icon={<Network className="h-5 w-5 text-primary" />}
      >
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border">
          <button
            onClick={() => setShowDetails(true)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-all ${
              showDetails
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Detailed
          </button>
          <button
            onClick={() => setShowDetails(false)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-all ${
              !showDetails
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Compact
          </button>
        </div>
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
          canEditHierarchy={isAdmin}
          onResendInvite={(id) => resendInvite.mutate(id)}
          onEditManager={handleEditManager}
          compact={!showDetails}
          draggable
        />
      )}

      {cardsMoved && (
        <button
          onClick={handleReset}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Layout
        </button>
      )}

      <ChangeManagerDialog
        open={managerDialogOpen}
        onOpenChange={setManagerDialogOpen}
        targetNode={selectedNode}
        allNodes={nodes ?? []}
        onConfirm={handleConfirmManager}
        isPending={updateLine.isPending}
      />

      <AddTeamMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
