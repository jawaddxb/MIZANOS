"use client";

import { useMemo } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import { OrgChartNodeCard } from "@/components/molecules/org-chart/OrgChartNodeCard";
import type { OrgChartNode } from "@/lib/types";

interface TreeNodeData extends OrgChartNode {
  children: TreeNodeData[];
}

function buildTree(nodes: OrgChartNode[]): TreeNodeData[] {
  const map = new Map<string, TreeNodeData>();
  const roots: TreeNodeData[] = [];

  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] });
  }

  for (const node of nodes) {
    const treeNode = map.get(node.id)!;
    if (node.reports_to && map.has(node.reports_to)) {
      map.get(node.reports_to)!.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  return roots;
}

interface OrgChartTreeProps {
  nodes: OrgChartNode[];
  canResendInvite: boolean;
  canEditHierarchy: boolean;
  onResendInvite: (id: string) => void;
  onEditManager: (node: OrgChartNode) => void;
}

function RenderTreeNode({
  node,
  canResendInvite,
  canEditHierarchy,
  onResendInvite,
  onEditManager,
}: {
  node: TreeNodeData;
  canResendInvite: boolean;
  canEditHierarchy: boolean;
  onResendInvite: (id: string) => void;
  onEditManager: (node: OrgChartNode) => void;
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
}: OrgChartTreeProps) {
  const roots = useMemo(() => buildTree(nodes), [nodes]);

  if (roots.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No team members found.</p>;
  }

  return (
    <div className="overflow-auto py-8">
      {roots.map((root) => (
        <Tree
          key={root.id}
          lineWidth="2px"
          lineColor="hsl(var(--border))"
          lineBorderRadius="8px"
          label={
            <OrgChartNodeCard
              node={root}
              canResendInvite={canResendInvite}
              canEditHierarchy={canEditHierarchy}
              onResendInvite={onResendInvite}
              onEditManager={onEditManager}
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
            />
          ))}
        </Tree>
      ))}
    </div>
  );
}
