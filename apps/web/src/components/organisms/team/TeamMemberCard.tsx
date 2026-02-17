"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/atoms/display/Badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/atoms/display/Avatar";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { Ban, ShieldCheck, Shield, MapPin, Mail, Send } from "lucide-react";
import { UserRolesDialog } from "./UserRolesDialog";
import { useUpdateUserStatus } from "@/hooks/queries/useUserManagement";
import { useResendInvite } from "@/hooks/mutations/useOrgChartMutations";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/lib/types/user";
import type { EvaluationSummary } from "@/lib/types/evaluation";

interface TeamMemberCardProps {
  profile: Profile;
  evaluationSummary?: EvaluationSummary;
  compact?: boolean;
}

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  engineer: "AI Engineer",
  pm: "Project Manager",
  marketing: "Marketing",
  bizdev: "Business Development",
  admin: "Senior Management",
};

function canManageUser(actorRole: string | undefined, targetRole: string | null): boolean {
  if (actorRole === "superadmin") return true;
  if (actorRole === "admin" && targetRole !== "admin" && targetRole !== "superadmin") return true;
  return false;
}

function getInitials(name: string | null): string {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";
}

function StatusBadge({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    invited: "bg-amber-100 text-amber-700 border-amber-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    suspended: "bg-red-100 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    active: "Active",
    invited: "Pending Invite",
    pending: "Pending Invite",
    suspended: "Suspended",
  };
  const key = status ?? "active";
  return (
    <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", styles[key] ?? styles.active)}>
      {labels[key] ?? "Active"}
    </span>
  );
}

export function TeamMemberCard({ profile, evaluationSummary, compact }: TeamMemberCardProps) {
  const [rolesOpen, setRolesOpen] = useState(false);
  const { user } = useAuth();
  const updateStatus = useUpdateUserStatus();
  const resendInvite = useResendInvite();

  const isSuspended = profile.status === "suspended";
  const isPending = profile.status === "invited" || profile.status === "pending";
  const canManage = canManageUser(user?.role, profile.role) && profile.user_id !== user?.id;

  if (compact) {
    return (
      <Link href={`/team/${profile.id}`} className="block">
        <div className={cn(
          "rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer flex gap-4 items-start",
          isSuspended && "opacity-60 border-destructive/30",
        )}>
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <Avatar className="h-14 w-14">
              {profile.avatar_url && (
                <AvatarImage src={getAvatarUrl(profile.avatar_url) ?? ""} alt={profile.full_name ?? ""} />
              )}
              <AvatarFallback className="text-lg font-medium">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            {profile.office_location && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[72px]">{profile.office_location}</span>
              </p>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-semibold text-foreground truncate">{profile.full_name ?? "Unknown"}</h3>
            {profile.email && (
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {roleLabels[profile.role ?? ""] ?? profile.role}
            </Badge>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <>
      <Link href={`/team/${profile.id}`} className="block">
        <div className={cn(
          "rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer h-full",
          isSuspended && "opacity-60 border-destructive/30",
        )}>
          <div className="flex gap-4">
            {/* Left section — Avatar + Location */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <Avatar className="h-16 w-16">
                {profile.avatar_url && (
                  <AvatarImage src={getAvatarUrl(profile.avatar_url) ?? ""} alt={profile.full_name ?? ""} />
                )}
                <AvatarFallback className="text-lg font-medium">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              {profile.office_location && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 text-center leading-tight">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[80px]">{profile.office_location}</span>
                </p>
              )}
            </div>

            {/* Right section — Details */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{profile.full_name ?? "Unknown"}</h3>
                {evaluationSummary && (
                  <span className={cn(
                    "shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold",
                    evaluationSummary.overall_score >= 4 ? "bg-status-healthy text-white" :
                    evaluationSummary.overall_score >= 3 ? "bg-status-warning text-white" :
                    "bg-status-critical text-white",
                  )}>
                    {evaluationSummary.overall_score.toFixed(1)}
                  </span>
                )}
              </div>

              {profile.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                  <Mail className="h-3 w-3 shrink-0" />
                  {profile.email}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {roleLabels[profile.role ?? ""] ?? profile.role}
                </Badge>
                <StatusBadge status={profile.status} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {isPending && canManage && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); resendInvite.mutate(profile.id); }}
                    className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <Send className="h-3 w-3" />
                    Resend Invite
                  </button>
                )}
                {canManage && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRolesOpen(true); }}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Shield className="h-3 w-3" />
                    Roles
                  </button>
                )}
                {canManage && (
                  <button
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      updateStatus.mutate({ userId: profile.id, status: isSuspended ? "active" : "suspended" });
                    }}
                    className={cn(
                      "flex items-center gap-1 text-[11px] transition-colors",
                      isSuspended ? "text-green-600 hover:text-green-700" : "text-destructive hover:text-destructive/80",
                    )}
                  >
                    {isSuspended ? <><ShieldCheck className="h-3 w-3" /> Restore</> : <><Ban className="h-3 w-3" /> Suspend</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>

      <UserRolesDialog open={rolesOpen} onOpenChange={setRolesOpen} profile={profile} />
    </>
  );
}
