"use client";

import { cn } from "@/lib/utils/cn";

interface FlowNode {
  id: string;
  label: string;
  type?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  className?: string;
  direction?: "horizontal" | "vertical";
}

function NodeBox({ node }: { node: FlowNode }) {
  const typeStyles: Record<string, string> = {
    start: "border-green-500/50 bg-green-500/10",
    end: "border-red-500/50 bg-red-500/10",
    decision: "border-yellow-500/50 bg-yellow-500/10",
  };

  return (
    <div
      className={cn(
        "rounded-lg border-2 px-4 py-2 text-sm font-medium text-center",
        "bg-card text-card-foreground shadow-sm",
        "min-w-[100px]",
        node.type && typeStyles[node.type]
      )}
    >
      {node.label}
    </div>
  );
}

function Arrow({
  label,
  direction,
}: {
  label?: string;
  direction: "horizontal" | "vertical";
}) {
  const isHorizontal = direction === "horizontal";

  return (
    <div
      className={cn(
        "flex items-center justify-center text-muted-foreground shrink-0",
        isHorizontal ? "flex-row px-1" : "flex-col py-1"
      )}
    >
      <div
        className={cn(
          "bg-border",
          isHorizontal ? "h-px w-6" : "w-px h-6"
        )}
      />
      {label && (
        <span className="text-[10px] text-muted-foreground px-1">{label}</span>
      )}
      <div
        className={cn(
          isHorizontal
            ? "border-t-[5px] border-b-[5px] border-l-[6px] border-t-transparent border-b-transparent border-l-border"
            : "border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-border"
        )}
      />
    </div>
  );
}

function FlowDiagram({
  nodes,
  edges,
  className,
  direction = "horizontal",
}: FlowDiagramProps) {
  if (nodes.length === 0) return null;

  const orderedNodes = orderNodes(nodes, edges);
  const isHorizontal = direction === "horizontal";

  return (
    <div
      className={cn(
        "flex items-center overflow-x-auto p-4",
        isHorizontal ? "flex-row flex-wrap gap-y-4" : "flex-col",
        className
      )}
    >
      {orderedNodes.map((node, idx) => {
        const edge = idx < orderedNodes.length - 1
          ? edges.find(
              (e) =>
                e.from === node.id && e.to === orderedNodes[idx + 1]?.id
            )
          : undefined;

        return (
          <div
            key={node.id}
            className={cn(
              "flex items-center",
              isHorizontal ? "flex-row" : "flex-col"
            )}
          >
            <NodeBox node={node} />
            {idx < orderedNodes.length - 1 && (
              <Arrow label={edge?.label} direction={direction} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function orderNodes(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  if (edges.length === 0) return nodes;

  const targets = new Set(edges.map((e) => e.to));
  const startNodes = nodes.filter((n) => !targets.has(n.id));
  if (startNodes.length === 0) return nodes;

  const result: FlowNode[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edgeMap = new Map<string, string[]>();
  for (const e of edges) {
    const existing = edgeMap.get(e.from) ?? [];
    existing.push(e.to);
    edgeMap.set(e.from, existing);
  }

  const queue = [...startNodes];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);
    result.push(current);
    for (const nextId of edgeMap.get(current.id) ?? []) {
      const next = nodeMap.get(nextId);
      if (next && !visited.has(nextId)) queue.push(next);
    }
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) result.push(n);
  }

  return result;
}

export { FlowDiagram };
export type { FlowDiagramProps, FlowNode, FlowEdge };
