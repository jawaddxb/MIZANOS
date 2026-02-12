"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/atoms/display/Badge";
import { Avatar } from "@/components/atoms/display/Avatar";
import { CheckCircle2 } from "lucide-react";
import { RecordCompletionDialog } from "./RecordCompletionDialog";
import type { Profile } from "@/lib/types/user";
import type { EvaluationSummary } from "@/lib/types/evaluation";

interface TeamMemberCardProps {
  profile: Profile;
  evaluationSummary?: EvaluationSummary;
}

const roleLabels: Record<string, string> = {
  engineer: "AI Engineer",
  pm: "Project Manager",
  marketing: "Marketing",
  bizdev: "Business Development",
  admin: "Senior Management",
};

const availabilityConfig = {
  available: { label: "Available", color: "bg-status-healthy" },
  busy: { label: "Busy", color: "bg-status-warning" },
  unavailable: { label: "Unavailable", color: "bg-status-critical" },
};

function scoreBadgeColor(score: number): string {
  if (score >= 4) return "bg-status-healthy text-white";
  if (score >= 3) return "bg-status-warning text-white";
  return "bg-status-critical text-white";
}

export function TeamMemberCard({ profile, evaluationSummary }: TeamMemberCardProps) {
  const [completionOpen, setCompletionOpen] = useState(false);
  const availability =
    availabilityConfig[profile.availability as keyof typeof availabilityConfig] ??
    availabilityConfig.available;

  return (
    <Link href={`/team/${profile.id}`} className="block">
      <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <span className="text-sm font-medium">
                {profile.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) ?? "?"}
              </span>
            </Avatar>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                availability.color,
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">
                {profile.full_name ?? "Unknown"}
              </h3>
              {evaluationSummary && (
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold",
                    scoreBadgeColor(evaluationSummary.overall_score),
                  )}
                >
                  {evaluationSummary.overall_score.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {roleLabels[profile.role ?? ""] ?? profile.role}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-medium">
              {profile.current_projects ?? 0}/{profile.max_projects ?? 3} projects
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                (profile.current_projects ?? 0) >= (profile.max_projects ?? 3)
                  ? "bg-status-critical"
                  : (profile.current_projects ?? 0) >= ((profile.max_projects ?? 3) * 0.7)
                    ? "bg-status-warning"
                    : "bg-status-healthy",
              )}
              style={{
                width: `${Math.min(
                  100,
                  ((profile.current_projects ?? 0) / (profile.max_projects ?? 3)) * 100,
                )}%`,
              }}
            />
          </div>

          {evaluationSummary && evaluationSummary.projects_completed > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium">{evaluationSummary.projects_completed} projects</span>
            </div>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {profile.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {skill}
                </Badge>
              ))}
              {profile.skills.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  +{profile.skills.length - 3}
                </Badge>
              )}
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCompletionOpen(true);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Record Completion
          </button>
        </div>

        <RecordCompletionDialog
          open={completionOpen}
          onOpenChange={setCompletionOpen}
          profileId={profile.id}
        />
      </div>
    </Link>
  );
}
