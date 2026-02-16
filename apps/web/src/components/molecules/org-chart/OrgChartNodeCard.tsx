"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/atoms/display/Avatar";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { MapPin, Mail, Send } from "lucide-react";
import type { OrgChartNode } from "@/lib/types";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  pm: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface OrgChartNodeCardProps {
  node: OrgChartNode;
  canResendInvite: boolean;
  canEditHierarchy: boolean;
  onResendInvite: (id: string) => void;
  onEditManager: (node: OrgChartNode) => void;
}

export function OrgChartNodeCard({
  node,
  canResendInvite,
  canEditHierarchy,
  onResendInvite,
  onEditManager,
}: OrgChartNodeCardProps) {
  const isPending = node.status === "pending";

  return (
    <div
      className="inline-flex flex-col items-center gap-1 rounded-lg border bg-card p-4 shadow-sm min-w-[200px] max-w-[240px] cursor-default"
      onClick={canEditHierarchy ? () => onEditManager(node) : undefined}
    >
      <Avatar className="h-12 w-12">
        {node.avatar_url && <AvatarImage src={node.avatar_url} alt={node.full_name ?? ""} />}
        <AvatarFallback className="text-sm font-medium">
          {getInitials(node.full_name)}
        </AvatarFallback>
      </Avatar>

      <p className="text-sm font-semibold text-foreground truncate max-w-full">
        {node.full_name ?? "Unnamed"}
      </p>

      {node.title && (
        <p className="text-xs text-muted-foreground truncate max-w-full">{node.title}</p>
      )}

      <div className="flex flex-wrap justify-center gap-1 mt-1">
        {node.roles.map((role) => (
          <Badge
            key={role}
            className={`text-[10px] px-1.5 py-0 border-0 ${ROLE_COLORS[role] ?? ""}`}
          >
            {role.replace("_", " ")}
          </Badge>
        ))}
      </div>

      {node.office_location && (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
          <MapPin className="h-3 w-3" /> {node.office_location}
        </span>
      )}

      {node.email && (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground truncate max-w-full">
          <Mail className="h-3 w-3" /> {node.email}
        </span>
      )}

      {isPending && (
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
            Pending
          </Badge>
          {canResendInvite && (
            <BaseButton
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                onResendInvite(node.id);
              }}
            >
              <Send className="h-3 w-3 mr-1" /> Resend
            </BaseButton>
          )}
        </div>
      )}
    </div>
  );
}
