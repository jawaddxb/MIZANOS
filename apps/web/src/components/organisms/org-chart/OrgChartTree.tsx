"use client";

import { useMemo, useRef } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import { AlertTriangle } from "lucide-react";
import { OrgChartNodeCard } from "@/components/molecules/org-chart/OrgChartNodeCard";
import { OrgChartLines } from "@/components/molecules/org-chart/OrgChartLines";
import type { OrgChartNode } from "@/lib/types";

interface TreeNodeData extends OrgChartNode {
  children: TreeNodeData[];
}

const LEADERSHIP_ROLES = new Set(["superadmin", "admin"]);

function buildTree(nodes: OrgChartNode[]): { roots: TreeNodeData[]; orphans: TreeNodeData[] } {
  const map = new Map<string, TreeNodeData>();
  const parentIds = new Set<string>();
  const topLevel: TreeNodeData[] = [];

  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] });
  }

  for (const node of nodes) {
    if (node.reports_to && map.has(node.reports_to)) {
      parentIds.add(node.reports_to);
    }
  }

  for (const node of nodes) {
    const treeNode = map.get(node.id)!;
    if (node.reports_to && map.has(node.reports_to)) {
      map.get(node.reports_to)!.children.push(treeNode);
    } else {
      topLevel.push(treeNode);
    }
  }

  const roots: TreeNodeData[] = [];
  const orphans: TreeNodeData[] = [];

  for (const node of topLevel) {
    const isManager = parentIds.has(node.id);
    const isLeadership = node.roles.some((r) => LEADERSHIP_ROLES.has(r));
    if (isManager || isLeadership) {
      roots.push(node);
    } else {
      orphans.push(node);
    }
  }

  return { roots, orphans };
}

interface OrgChartTreeProps {
  nodes: OrgChartNode[];
  canResendInvite: boolean;
  canEditHierarchy: boolean;
  onResendInvite: (id: string) => void;
  onEditManager: (node: OrgChartNode) => void;
  compact?: boolean;
  draggable?: boolean;
}

function RenderTreeNode({
  node,
  canResendInvite,
  canEditHierarchy,
  onResendInvite,
  onEditManager,
  compact,
  draggable,
}: {
  node: TreeNodeData;
  canResendInvite: boolean;
  canEditHierarchy: boolean;
  onResendInvite: (id: string) => void;
  onEditManager: (node: OrgChartNode) => void;
  compact?: boolean;
  draggable?: boolean;
}) {
  return (
    <TreeNode
      label={
        <OrgChartNodeCard
          node={node}
          canResendInvite={canResendInvite}
          canEditHierarchy={canEditHierarchy}
          onResendInvite={onResendInvite}
          onEditManager={onEditManager}
          compact={compact}
          draggable={draggable}
        />
      }
    >
      {node.children.map((child) => (
        <RenderTreeNode
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
    </TreeNode>
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
  const { roots, orphans } = useMemo(() => buildTree(nodes), [nodes]);

  if (roots.length === 0 && orphans.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No team members found.</p>;
  }

  return (
    <div className="space-y-6">
      {roots.length > 0 && (
        <div ref={containerRef} className="overflow-auto py-4 relative">
          {draggable && <OrgChartLines nodes={nodes} containerRef={containerRef} />}
          {roots.map((root) => (
            <Tree
              key={root.id}
              lineWidth={draggable ? "0px" : "1px"}
              lineColor={draggable ? "transparent" : "hsl(var(--border))"}
              lineBorderRadius="6px"
              label={
                <OrgChartNodeCard
                  node={root}
                  canResendInvite={canResendInvite}
                  canEditHierarchy={canEditHierarchy}
                  onResendInvite={onResendInvite}
                  onEditManager={onEditManager}
                  compact={compact}
                  draggable={draggable}
                />
              }
            >
              {root.children.map((child) => (
                <RenderTreeNode
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
            </Tree>
          ))}
        </div>
      )}

      {orphans.length > 0 && (
        <div className="border-t pt-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-status-warning" />
            <h3 className="text-sm font-semibold">
              Unassigned ({orphans.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              No reporting line
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
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
      )}
    </div>
  );
}
