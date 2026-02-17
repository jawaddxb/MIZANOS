"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardEdit, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/atoms/display/Avatar";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { EvaluationBreakdown } from "@/components/organisms/team/EvaluationBreakdown";
import { ProjectCompletionTable } from "@/components/organisms/team/ProjectCompletionTable";
import { RecordEvaluationDialog } from "@/components/organisms/team/RecordEvaluationDialog";
import { RecordCompletionDialog } from "@/components/organisms/team/RecordCompletionDialog";
import { useProfile } from "@/hooks/queries/useProfiles";
import { useEvaluations, useProjectCompletions } from "@/hooks/queries/useEvaluations";

const roleLabels: Record<string, string> = {
  engineer: "AI Engineer",
  pm: "Project Manager",
  marketing: "Marketing",
  bizdev: "Business Development",
  admin: "Senior Management",
};

const availabilityConfig: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "bg-status-healthy" },
  busy: { label: "Busy", color: "bg-status-warning" },
  unavailable: { label: "Unavailable", color: "bg-status-critical" },
};

function scoreColor(score: number): string {
  if (score >= 4) return "text-status-healthy";
  if (score >= 3) return "text-status-warning";
  return "text-status-critical";
}

export default function EngineerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading: profileLoading } = useProfile(id);
  const { data: evaluations = [], isLoading: evalsLoading } = useEvaluations(id);
  const { data: completions = [], isLoading: completionsLoading } = useProjectCompletions(id);

  const [evalOpen, setEvalOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [selectedEvalIdx, setSelectedEvalIdx] = useState(0);

  if (profileLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">Engineer not found</p>
        <Link href="/team" className="text-sm text-primary hover:underline mt-2 inline-block">
          Back to team
        </Link>
      </div>
    );
  }

  const availability = availabilityConfig[profile.availability ?? "available"] ?? availabilityConfig.available;
  const latestEval = evaluations[selectedEvalIdx] ?? null;
  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/team" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to team
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 rounded-lg border bg-card p-5">
        <div className="relative">
          <Avatar className="h-16 w-16 text-lg">
            {profile.avatar_url && (
              <AvatarImage src={getAvatarUrl(profile.avatar_url) ?? ""} alt={profile.full_name ?? ""} />
            )}
            <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <span className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background", availability.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold truncate">{profile.full_name}</h1>
            {latestEval && (
              <span className={cn("text-2xl font-bold", scoreColor(latestEval.overall_score))}>
                {latestEval.overall_score.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{roleLabels[profile.role ?? ""] ?? profile.role}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="secondary">{availability.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {profile.current_projects ?? 0}/{profile.max_projects ?? 3} projects
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEvalOpen(true)}>
            <ClipboardEdit className="h-4 w-4 mr-1" /> Evaluate
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCompletionOpen(true)}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
          </Button>
        </div>
      </div>

      {/* Evaluation Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Evaluation Breakdown</h2>
          {evaluations.length > 1 && (
            <select
              value={selectedEvalIdx}
              onChange={(e) => setSelectedEvalIdx(Number(e.target.value))}
              className="h-8 rounded-md border bg-background px-2 text-sm"
            >
              {evaluations.map((ev, i) => (
                <option key={ev.id} value={i}>{ev.evaluation_period}</option>
              ))}
            </select>
          )}
        </div>
        {evalsLoading ? <Skeleton className="h-48" /> : <EvaluationBreakdown evaluation={latestEval} />}
      </section>

      {/* Project History */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Project History</h2>
        {completionsLoading ? <Skeleton className="h-32" /> : <ProjectCompletionTable completions={completions} />}
      </section>

      <RecordEvaluationDialog open={evalOpen} onOpenChange={setEvalOpen} profileId={id} />
      <RecordCompletionDialog open={completionOpen} onOpenChange={setCompletionOpen} profileId={id} />
    </div>
  );
}
