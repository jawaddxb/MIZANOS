"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Progress } from "@/components/atoms/feedback/Progress";
import { HealthScore } from "@/components/molecules/indicators/HealthScore";
import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

interface StatsGridProps {
  healthScore: number;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  blockers: number;
}

function StatsGrid({
  healthScore,
  progress,
  tasksCompleted,
  totalTasks,
  blockers,
}: StatsGridProps) {
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

export { StatsGrid };
export type { StatsGridProps };
