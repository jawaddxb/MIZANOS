"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Progress } from "@/components/atoms/feedback/Progress";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import {
  Activity,
  ChevronRight,
  Rocket,
  Shield,
  TestTube,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useProducts } from "@/hooks/queries/useProducts";
import type { Product } from "@/lib/types";

const stageConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  QA: {
    icon: <TestTube className="h-3.5 w-3.5" />,
    color: "text-pillar-development",
    bg: "bg-pillar-development/10",
  },
  Security: {
    icon: <Shield className="h-3.5 w-3.5" />,
    color: "text-pillar-marketing",
    bg: "bg-pillar-marketing/10",
  },
  Deployment: {
    icon: <Rocket className="h-3.5 w-3.5" />,
    color: "text-pillar-business",
    bg: "bg-pillar-business/10",
  },
};

const PRODUCTION_STAGES = ["QA", "Security", "Deployment"];

function getStatusBadge(status: string | null) {
  switch (status) {
    case "healthy":
      return (
        <Badge variant="outline" className="text-xs border-status-healthy/50 text-status-healthy bg-status-healthy/5">
          Healthy
        </Badge>
      );
    case "warning":
      return (
        <Badge variant="outline" className="text-xs border-status-warning/50 text-status-warning bg-status-warning/5">
          Warning
        </Badge>
      );
    case "critical":
      return (
        <Badge variant="destructive" className="text-xs">
          Critical
        </Badge>
      );
    default:
      return null;
  }
}

function getHealthColor(score: number) {
  if (score >= 80) return "text-status-healthy";
  if (score >= 60) return "text-status-warning";
  return "text-status-critical";
}

function getHealthBg(score: number) {
  if (score >= 80) return "bg-status-healthy/10";
  if (score >= 60) return "bg-status-warning/10";
  return "bg-status-critical/10";
}

function LoadingSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="h-5 w-5 rounded-lg bg-muted animate-pulse" />
          <span>Production Pipeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg border animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductionHealth() {
  const { data: products = [], isLoading } = useProducts();

  const projects = products.filter((p) =>
    PRODUCTION_STAGES.includes(p.stage || ""),
  );

  if (isLoading) return <LoadingSkeleton />;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-pillar-development/10 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-pillar-development" />
            </div>
            Production Pipeline
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-medium">
            {projects.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-2">
              {projects.map((project, index) => (
                <ProjectRow key={project.id} project={project} index={index} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
        <Zap className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">Pipeline Clear</p>
      <p className="text-sm text-muted-foreground mt-1">
        No projects in QA, Security, or Deployment
      </p>
    </div>
  );
}

function ProjectRow({ project, index }: { project: Product; index: number }) {
  const config = stageConfig[project.stage || ""] || stageConfig.Deployment;
  const healthScore = project.health_score ?? 0;
  const progress = project.progress ?? 0;

  return (
    <Link
      href={`/products/${project.id}`}
      className="block p-3 rounded-lg border hover:border-border transition-all duration-200 group hover:bg-accent/30"
      style={{
        opacity: 0,
        animation: `fade-in 0.3s ease-out ${index * 50}ms forwards`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
              "transition-transform duration-200 group-hover:scale-110",
              config.bg,
              config.color,
            )}
          >
            {config.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-foreground/90">
              {project.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {project.stage}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {getStatusBadge(project.status)}
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <div
          className={cn(
            "flex-shrink-0 w-16 text-right p-2 rounded-lg",
            getHealthBg(healthScore),
          )}
        >
          <p
            className={cn(
              "text-lg font-bold font-mono tabular-nums",
              getHealthColor(healthScore),
            )}
          >
            {healthScore}%
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Health
          </p>
        </div>
      </div>
    </Link>
  );
}
