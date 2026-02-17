"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/atoms/display/Avatar";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { MapPin, Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getAvatarUrl } from "@/lib/utils/avatar";
import type { OrgChartNode } from "@/lib/types";

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  pm: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  engineer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  bizdev: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  marketing: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  pm: "PM",
  engineer: "Engineer",
  bizdev: "BizDev",
  marketing: "Marketing",
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

interface OrgChartNodeCardProps {
  node: OrgChartNode;
  canResendInvite: boolean;
  canEditHierarchy: boolean;
  onResendInvite: (id: string) => void;
  onEditManager: (node: OrgChartNode) => void;
  compact?: boolean;
  draggable?: boolean;
}

export function OrgChartNodeCard({
  node,
  canResendInvite,
  canEditHierarchy,
  onResendInvite,
  onEditManager,
  compact,
  draggable: canDrag,
}: OrgChartNodeCardProps) {
  const isPending = node.status === "pending";
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!canDrag) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      setDragging(true);
    },
    [canDrag, offset],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      setOffset({
        x: dragStart.current.ox + (e.clientX - dragStart.current.x),
        y: dragStart.current.oy + (e.clientY - dragStart.current.y),
      });
      window.dispatchEvent(new Event("org-chart-drag"));
    },
    [dragging],
  );

  const onPointerUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    const reset = () => {
      setOffset({ x: 0, y: 0 });
      requestAnimationFrame(() => window.dispatchEvent(new Event("org-chart-drag")));
    };
    window.addEventListener("org-chart-reset", reset);
    return () => window.removeEventListener("org-chart-reset", reset);
  }, []);

  const pointerProps = canDrag
    ? { onPointerDown, onPointerMove, onPointerUp }
    : {};

  const style = canDrag
    ? { transform: `translate(${offset.x}px, ${offset.y}px)`, zIndex: dragging ? 50 : "auto" }
    : undefined;

  if (compact) {
    return (
      <div
        data-node-id={node.id}
        {...pointerProps}
        style={style}
        className={cn(
          "inline-flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 shadow-sm hover:shadow-md transition-shadow select-none",
          canDrag ? "cursor-grab" : "cursor-default",
          dragging && "cursor-grabbing shadow-lg opacity-90",
        )}
        onClick={!canDrag && canEditHierarchy ? () => onEditManager(node) : undefined}
      >
        <Avatar className="h-9 w-9 shrink-0">
          {node.avatar_url && (
            <AvatarImage src={getAvatarUrl(node.avatar_url) ?? ""} alt={node.full_name ?? ""} />
          )}
          <AvatarFallback className="text-xs font-medium">
            {getInitials(node.full_name)}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">
          {node.full_name ?? "Unnamed"}
        </p>
      </div>
    );
  }

  return (
    <div
      data-node-id={node.id}
      {...pointerProps}
      style={style}
      className={cn(
        "inline-flex rounded-lg border bg-card shadow-sm min-w-[260px] max-w-[340px] hover:shadow-md transition-shadow overflow-hidden select-none",
        canDrag ? "cursor-grab" : "cursor-default",
        dragging && "cursor-grabbing shadow-lg opacity-90",
      )}
      onClick={!canDrag && canEditHierarchy ? () => onEditManager(node) : undefined}
    >
      {/* Left section — Avatar + Location */}
      <div className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 bg-muted/30 border-r">
        <Avatar className="h-11 w-11">
          {node.avatar_url && (
            <AvatarImage src={getAvatarUrl(node.avatar_url) ?? ""} alt={node.full_name ?? ""} />
          )}
          <AvatarFallback className="text-sm font-medium">
            {getInitials(node.full_name)}
          </AvatarFallback>
        </Avatar>
        {node.office_location && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate max-w-[60px]">{node.office_location}</span>
          </span>
        )}
      </div>

      {/* Right section — Details */}
      <div className="min-w-0 flex-1 px-3 py-2.5 space-y-0.5 text-left">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate flex-1">
            {node.full_name ?? "Unnamed"}
          </p>
          {isPending && canResendInvite && (
            <BaseButton
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onResendInvite(node.id);
              }}
            >
              <Send className="h-3 w-3" />
            </BaseButton>
          )}
        </div>

        {node.email && (
          <p className="text-[11px] text-muted-foreground truncate leading-tight">
            {node.email}
          </p>
        )}

        {node.title && (
          <p className="text-[11px] text-muted-foreground truncate leading-tight">
            {node.title}
          </p>
        )}

        <div className="flex items-center gap-1 pt-0.5 justify-start">
          {node.roles.slice(0, 2).map((role) => (
            <span
              key={role}
              className={`text-[10px] px-1.5 py-px rounded font-medium ${ROLE_COLORS[role] ?? "bg-muted text-muted-foreground"}`}
            >
              {ROLE_LABELS[role] ?? role}
            </span>
          ))}
          {isPending && (
            <span className="text-[10px] px-1.5 py-px rounded font-medium text-amber-600 bg-amber-50 dark:bg-amber-950">
              Pending
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
