"use client";

import { AlertTriangle } from "lucide-react";
import { OrgChartNodeCard } from "@/components/molecules/org-chart/OrgChartNodeCard";
import type { OrgChartNode } from "@/lib/types";
import type { TreeNodeData } from "./OrgChartTree";

interface UnassignedSidebarProps {
  orphans: TreeNodeData[];
  canResendInvite: boolean;
  canEditHierarchy: boolean;
  onResendInvite: (id: string) => void;
  onEditManager: (node: OrgChartNode) => void;
  compact?: boolean;
}

export function UnassignedSidebar({
  orphans,
  canResendInvite,
  canEditHierarchy,
  onResendInvite,
  onEditManager,
  compact,
}: UnassignedSidebarProps) {
  if (orphans.length === 0) return null;

  return (
    <div className="w-[280px] shrink-0 border-l bg-muted/30 p-4 self-start sticky top-0 max-h-screen overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-status-warning shrink-0" />
        <h3 className="text-sm font-semibold">
          Unassigned ({orphans.length})
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">No reporting line</p>
      <div className="flex flex-col gap-2.5">
        {orphans.map((node) => (
          <OrgChartNodeCard
            key={node.id}
            node={node}
            canResendInvite={canResendInvite}
            canEditHierarchy={canEditHierarchy}
            onResendInvite={onResendInvite}
            onEditManager={onEditManager}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
