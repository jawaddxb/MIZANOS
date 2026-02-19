"use client";

import { useMemo, useRef } from "react";
import { OrgChartNodeCard } from "@/components/molecules/org-chart/OrgChartNodeCard";
import { OrgChartLines } from "@/components/molecules/org-chart/OrgChartLines";
import { buildTree } from "./buildTree";
import type { TreeNodeData } from "./buildTree";
import type { OrgChartNode } from "@/lib/types";

interface OrgChartTreeProps {
  nodes: OrgChartNode[];
  canResendInvite: boolean;
  canEditHierarchy: boolean;
  onResendInvite: (id: string) => void;
  onEditManager: (node: OrgChartNode) => void;
  compact?: boolean;
  draggable?: boolean;
}

interface BranchProps {
  node: TreeNodeData;
  canResendInvite: boolean;
  canEditHierarchy: boolean;
  onResendInvite: (id: string) => void;
  onEditManager: (node: OrgChartNode) => void;
  compact?: boolean;
  draggable?: boolean;
}

function TreeBranch({
  node,
  canResendInvite,
  canEditHierarchy,
  onResendInvite,
  onEditManager,
  compact,
  draggable,
}: BranchProps) {
  return (
    <div className="flex items-center">
      <div className="shrink-0 py-1.5">
        <OrgChartNodeCard
          node={node}
          canResendInvite={canResendInvite}
          canEditHierarchy={canEditHierarchy}
          onResendInvite={onResendInvite}
          onEditManager={onEditManager}
          compact={compact}
          draggable={draggable}
        />
      </div>
      {node.children.length > 0 && (
        <div className="flex flex-col ml-10">
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              canResendInvite={canResendInvite}
              canEditHierarchy={canEditHierarchy}
              onResendInvite={onResendInvite}
              onEditManager={onEditManager}
              compact={compact}
              draggable={draggable}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgChartTree({
  nodes,
  canResendInvite,
  canEditHierarchy,
  onResendInvite,
  onEditManager,
  compact,
  draggable,
}: OrgChartTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { roots } = useMemo(() => buildTree(nodes), [nodes]);

  if (roots.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No team members found.</p>;
  }

  return (
    <div ref={containerRef} className="overflow-auto py-4 px-4 relative">
      <OrgChartLines nodes={nodes} containerRef={containerRef} />
      <div className="flex flex-col gap-6">
        {roots.map((root) => (
          <TreeBranch
            key={root.id}
            node={root}
            canResendInvite={canResendInvite}
            canEditHierarchy={canEditHierarchy}
            onResendInvite={onResendInvite}
            onEditManager={onEditManager}
            compact={compact}
            draggable={draggable}
          />
        ))}
      </div>
    </div>
  );
}
