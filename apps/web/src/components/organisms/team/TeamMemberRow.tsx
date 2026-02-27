"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/atoms/display/Badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/atoms/display/Avatar";
import { StatusBadge } from "@/components/atoms/display/StatusBadge";
import { ConfirmDialog } from "@/components/molecules/feedback/ConfirmDialog";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { Shield, Send } from "lucide-react";
import { UserRolesDialog } from "./UserRolesDialog";
import { useResendInvite } from "@/hooks/mutations/useOrgChartMutations";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_CONFIG } from "@/lib/constants/roles";
import type { Profile, UserRole } from "@/lib/types";
import type { AppRole } from "@/lib/types/enums";
import type { EvaluationSummary } from "@/lib/types/evaluation";

interface TeamMemberRowProps {
  profile: Profile;
  evaluationSummary?: EvaluationSummary;
  additionalRoles?: UserRole[];
  managerName?: string | null;
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
  if (actorRole === "business_owner" && targetRole !== "superadmin") return true;
  if (actorRole === "admin" && targetRole !== "admin" && targetRole !== "superadmin" && targetRole !== "business_owner") return true;
  if (actorRole === "project_manager" && targetRole !== "admin" && targetRole !== "superadmin" && targetRole !== "business_owner") return true;
  return false;
}

export function TeamMemberRow({ profile, evaluationSummary, additionalRoles = [], managerName }: TeamMemberRowProps) {
  const [rolesOpen, setRolesOpen] = useState(false);
  const [confirmResend, setConfirmResend] = useState(false);
  const { user } = useAuth();
  const resendInvite = useResendInvite();
  const isSuspended = profile.status === "suspended";
  const isPending = profile.status === "invited" || profile.status === "pending";
  const canManage = canManageRole(user?.role, profile.role) && profile.user_id !== user?.id;
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
          <Avatar className="h-10 w-10">
            {profile.avatar_url && (
              <AvatarImage src={getAvatarUrl(profile.avatar_url) ?? ""} alt={profile.full_name ?? ""} className="object-cover" />
            )}
            <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
              availability.color,
            )}
          />
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-[150px_120px_130px_120px_80px_1fr_100px_auto] items-center gap-4">
          <div className="min-w-0">
            <span className="text-sm font-medium text-foreground truncate block">
              {profile.full_name ?? "Unknown"}
            </span>
            {profile.email && (
              <span className="text-[11px] text-muted-foreground truncate block">
                {profile.email}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <Badge variant="secondary" className="text-[10px] !px-1.5 !py-0 font-normal truncate">
              {roleLabel(profile.role)}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1 min-w-0">
            {additionalRoles.length > 0 ? (
              additionalRoles.map((ur) => (
                <Badge key={ur.id} variant="secondary" className="text-[10px] !px-1.5 !py-0 font-normal">
                  {ROLE_CONFIG[ur.role as AppRole]?.label ?? ur.role}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground/50">—</span>
            )}
          </div>

          <span className="text-xs text-muted-foreground truncate">
            {managerName ?? "—"}
          </span>

          <span className="text-xs text-muted-foreground">
            {availability.label}
          </span>

          <div className="flex gap-1 min-w-0 overflow-hidden">
            {profile.skills?.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px] !px-1.5 !py-0 font-normal shrink-0">
                {skill}
              </Badge>
            ))}
            {(profile.skills?.length ?? 0) > 3 && (
              <Badge variant="outline" className="text-[10px] !px-1.5 !py-0 font-normal shrink-0">
                +{(profile.skills?.length ?? 0) - 3}
              </Badge>
            )}
          </div>

          <StatusBadge status={profile.status} />

          <div className="shrink-0 flex items-center gap-2">
            {isPending && canManage && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmResend(true); }}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Send className="h-3 w-3" />
                Resend Invite
              </button>
            )}
            {canManage && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRolesOpen(true); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 rounded-md px-2.5 py-1 hover:bg-primary/10 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                Roles
              </button>
            )}
          </div>
        </div>
      </Link>

      <UserRolesDialog
        open={rolesOpen}
        onOpenChange={setRolesOpen}
        profile={profile}
      />
      <ConfirmDialog
        open={confirmResend}
        onOpenChange={setConfirmResend}
        title="Resend Invitation"
        description={`Send a new invitation email to ${profile.full_name ?? "this member"}?`}
        confirmLabel="Send Invite"
        onConfirm={() => resendInvite.mutate(profile.id)}
        loading={resendInvite.isPending}
      />
    </>
  );
}
