"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Progress } from "@/components/atoms/feedback/Progress";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { HealthScore } from "@/components/molecules/indicators/HealthScore";
import { PillarBadge } from "@/components/molecules/indicators/PillarBadge";
import { useProductDetail } from "@/hooks/queries/useProductDetail";
import { useTasks } from "@/hooks/queries/useTasks";
import { useLatestSpecification } from "@/hooks/queries/useSpecifications";
import type { ProductMember } from "@/lib/types";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
} from "lucide-react";

interface ProductOverviewProps {
  productId: string;
}

const STAGES = ["Intake", "Development", "QA", "Security", "Deployment"] as const;

function StatsGrid({
  healthScore,
  progress,
  tasksCompleted,
  totalTasks,
  blockers,
}: {
  healthScore: number;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  blockers: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HealthScore score={healthScore} size="lg" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-2xl font-semibold tabular-nums">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-1.5 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-semibold tabular-nums">
              {tasksCompleted}/{totalTasks}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalTasks - tasksCompleted} remaining
          </p>
        </CardContent>
      </Card>

      <Card className={blockers > 0 ? "border-destructive/30" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Blockers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {blockers > 0 ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            )}
            <span className="text-2xl font-semibold tabular-nums">{blockers}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {blockers > 0 ? "Action required" : "No blockers"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StageProgress({ currentStage }: { currentStage: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stage Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {STAGES.map((stage, i) => {
            const stageIndex = STAGES.indexOf(
              currentStage as (typeof STAGES)[number],
            );
            const isComplete = stageIndex >= 0 && i < stageIndex;
            const isCurrent = stage === currentStage;
            return (
              <div key={stage} className="flex items-center gap-3">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-secondary text-secondary-foreground ring-2 ring-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? "\u2713" : i + 1}
                </div>
                <span
                  className={`text-sm ${
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {stage}
                </span>
                {isCurrent && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-primary">
                    <Clock className="h-3 w-3" />
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TeamCard({ members }: { members: ProductMember[] }) {
  if (members.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{member.profile_id}</span>
            <Badge variant="outline">{member.role ?? "Member"}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProductOverview({ productId }: ProductOverviewProps) {
  const { data, isLoading } = useProductDetail(productId);
  const { data: tasks } = useTasks(productId);
  const { data: specification } = useLatestSpecification(productId);

  if (isLoading || !data?.product) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const { product, members } = data;
  const totalTasks = tasks?.length ?? 0;
  const tasksCompleted =
    tasks?.filter((t) => t.status === "done").length ?? 0;
  const blockers =
    tasks?.filter((t) => t.priority === "high" && t.status !== "done").length ??
    0;
  const specContent = specification?.content as
    | Record<string, unknown>
    | null;
  const overview = specContent?.overview as string | undefined;

  return (
    <div className="space-y-6">
      {overview ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {overview}
            </p>
          </CardContent>
        </Card>
      ) : !specification ? (
        <Card className="border-dashed border-muted-foreground/30">
          <CardContent className="py-8 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No project data uploaded yet. Upload documents or notes in the
              Intake stage to generate the project overview.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <StatsGrid
        healthScore={product.health_score ?? 0}
        progress={product.progress ?? 0}
        tasksCompleted={tasksCompleted}
        totalTasks={totalTasks}
        blockers={blockers}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Stage</span>
              <span className="font-medium">{product.stage ?? "N/A"}</span>
            </div>
            {product.pillar && (
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Pillar</span>
                <PillarBadge pillar={product.pillar} />
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span className="tabular-nums text-xs">
                {new Date(product.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="tabular-nums text-xs">
                {new Date(product.updated_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <StageProgress currentStage={product.stage ?? "Intake"} />
      </div>

      <TeamCard members={members} />
    </div>
  );
}

export { ProductOverview };
export type { ProductOverviewProps };
