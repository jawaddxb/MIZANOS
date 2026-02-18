"use client";

import { useState, useEffect, useCallback, useMemo, type RefObject } from "react";
import type { OrgChartNode } from "@/lib/types";

interface OrgChartLinesProps {
  nodes: OrgChartNode[];
  containerRef: RefObject<HTMLDivElement | null>;
}

export function OrgChartLines({ nodes, containerRef }: OrgChartLinesProps) {
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const edges = useMemo(
    () => {
      const idSet = new Set(nodes.map((n) => n.id));
      return nodes
        .filter((n) => n.reports_to && idSet.has(n.reports_to))
        .map((n) => ({ parent: n.reports_to!, child: n.id }));
    },
    [nodes],
  );

  const recalc = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();

    const cards = container.querySelectorAll<HTMLElement>("[data-node-id]");
    const posMap = new Map<string, DOMRect>();
    cards.forEach((card) => posMap.set(card.dataset.nodeId!, card.getBoundingClientRect()));

    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const newLines = edges
      .map(({ parent, child }) => {
        const pRect = posMap.get(parent);
        const chRect = posMap.get(child);
        if (!pRect || !chRect) return null;
        return {
          x1: pRect.left + pRect.width / 2 - cRect.left + scrollLeft,
          y1: pRect.bottom - cRect.top + scrollTop,
          x2: chRect.left + chRect.width / 2 - cRect.left + scrollLeft,
          y2: chRect.top - cRect.top + scrollTop,
        };
      })
      .filter(Boolean) as { x1: number; y1: number; x2: number; y2: number }[];

    setLines(newLines);
  }, [edges, containerRef]);

  useEffect(() => {
    recalc();
    const observer = new ResizeObserver(recalc);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [recalc, containerRef]);

  useEffect(() => {
    let rafId = 0;
    const handler = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(recalc);
    };
    window.addEventListener("org-chart-drag", handler);
    return () => {
      window.removeEventListener("org-chart-drag", handler);
      cancelAnimationFrame(rafId);
    };
  }, [recalc]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
    >
      {lines.map((l, i) => {
        const midY = (l.y1 + l.y2) / 2;
        return (
          <path
            key={i}
            d={`M${l.x1},${l.y1} C${l.x1},${midY} ${l.x2},${midY} ${l.x2},${l.y2}`}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
