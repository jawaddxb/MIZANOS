"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/atoms/display/Badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/atoms/display/Avatar";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { Shield } from "lucide-react";
import { UserRolesDialog } from "./UserRolesDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_CONFIG } from "@/lib/constants/roles";
import type { Profile, UserRole } from "@/lib/types";
import type { AppRole } from "@/lib/types/enums";
import type { EvaluationSummary } from "@/lib/types/evaluation";

interface TeamMemberRowProps {
  profile: Profile;
  evaluationSummary?: EvaluationSummary;
  additionalRoles?: UserRole[];
}

const roleLabel = (role: string | null): string => {
  return ROLE_CONFIG[role as AppRole]?.label ?? role ?? "Unknown";
};

const availabilityConfig = {
  available: { label: "Available", color: "bg-status-healthy" },
  busy: { label: "Busy", color: "bg-status-warning" },
  unavailable: { label: "Unavailable", color: "bg-status-critical" },
};

function canManageRole(actorRole: string | undefined, targetRole: string | null): boolean {
  if (actorRole === "superadmin") return true;
  if (actorRole === "admin" && targetRole !== "admin" && targetRole !== "superadmin") return true;
  return false;
}

export function TeamMemberRow({ profile, evaluationSummary, additionalRoles = [] }: TeamMemberRowProps) {
  const [rolesOpen, setRolesOpen] = useState(false);
  const { user } = useAuth();
  const isSuspended = profile.status === "suspended";
  const showRoleManagement = canManageRole(user?.role, profile.role) && profile.user_id !== user?.id;
  const availability =
    availabilityConfig[profile.availability as keyof typeof availabilityConfig] ??
    availabilityConfig.available;
  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  return (
    <>
      <Link
        href={`/team/${profile.id}`}
        className={cn(
          "flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors",
          isSuspended && "opacity-60",
        )}
      >
        <div className="relative shrink-0">
          <Avatar className="h-8 w-8">
            {profile.avatar_url && (
              <AvatarImage src={getAvatarUrl(profile.avatar_url) ?? ""} alt={profile.full_name ?? ""} />
            )}
            <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
              availability.color,
            )}
          />
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-[160px_120px_150px_80px_90px_40px_1fr_auto] items-center gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground truncate">
                {profile.full_name ?? "Unknown"}
              </span>
              {isSuspended && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Suspended
                </Badge>
              )}
            </div>
          </div>

          <span className="text-xs text-muted-foreground truncate">
            {roleLabel(profile.role)}
          </span>

          <div className="flex flex-wrap gap-1 min-w-0">
            {additionalRoles.length > 0 ? (
              additionalRoles.map((ur) => (
                <Badge key={ur.id} variant="outline" className="text-[10px] px-1.5 py-0">
                  {ROLE_CONFIG[ur.role as AppRole]?.label ?? ur.role}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground/50">—</span>
            )}
          </div>

          <span className="text-xs text-muted-foreground">
            {availability.label}
          </span>

          <span className="text-xs text-muted-foreground">
            {profile.current_projects ?? 0}/{profile.max_projects ?? 3} projects
          </span>

          <span className="text-xs font-medium tabular-nums">
            {evaluationSummary ? evaluationSummary.overall_score.toFixed(1) : ""}
          </span>

          <div className="flex gap-1 min-w-0 overflow-hidden">
            {profile.skills?.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                {skill}
              </Badge>
            ))}
            {(profile.skills?.length ?? 0) > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                +{(profile.skills?.length ?? 0) - 3}
              </Badge>
            )}
          </div>

          {showRoleManagement ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setRolesOpen(true);
              }}
              className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield className="h-3 w-3" />
              Roles
            </button>
          ) : (
            <span />
          )}
        </div>
      </Link>

      <UserRolesDialog
        open={rolesOpen}
        onOpenChange={setRolesOpen}
        profile={profile}
      />
    </>
  );
}
