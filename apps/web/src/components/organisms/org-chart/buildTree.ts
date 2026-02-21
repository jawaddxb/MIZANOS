import type { OrgChartNode } from "@/lib/types";

export interface TreeNodeData extends OrgChartNode {
  children: TreeNodeData[];
}

const LEADERSHIP_ROLES = new Set(["business_owner", "executive"]);

export function buildTree(nodes: OrgChartNode[]): { roots: TreeNodeData[]; orphans: TreeNodeData[] } {
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

  // When no hierarchy exists, show all members in the tree instead of the sidebar
  if (roots.length === 0) {
    roots.push(...orphans.splice(0));
  }

  return { roots, orphans };
}
