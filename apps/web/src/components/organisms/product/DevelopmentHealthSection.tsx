"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Button } from "@/components/molecules/buttons/Button";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { useRepositoryAnalysis, useAnalyzeRepository } from "@/hooks/queries/useRepositoryAnalysis";
import { useLatestAudit } from "@/hooks/queries/useAuditHistory";
import { useRunAudit } from "@/hooks/mutations/useAuditMutations";
import {
  Activity,
  Code2,
  FileCheck,
  Shield,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface DevelopmentHealthSectionProps {
  productId: string;
  repositoryUrl: string;
  specificationId?: string;
}

function HealthCard({
  title,
  icon: Icon,
  score,
  label,
}: {
  title: string;
  icon: typeof Activity;
  score: number;
  label: string;
}) {
  const color =
    score >= 80
      ? "text-status-healthy"
      : score >= 50
        ? "text-status-warning"
        : "text-status-critical";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-end gap-2">
          <span className={`text-2xl font-bold tabular-nums ${color}`}>
            {score}%
          </span>
          <span className="text-xs text-muted-foreground mb-1">{label}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              score >= 80
                ? "bg-status-healthy"
                : score >= 50
                  ? "bg-status-warning"
                  : "bg-status-critical"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function DevelopmentHealthSection({
  productId,
  repositoryUrl,
  specificationId,
}: DevelopmentHealthSectionProps) {
  const { data: analysis, isLoading: analysisLoading } = useRepositoryAnalysis(productId);
  const { data: audit, isLoading: auditLoading } = useLatestAudit(productId);
  const analyzeRepo = useAnalyzeRepository(productId);
  const runAudit = useRunAudit(productId);

  const isLoading = analysisLoading || auditLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Development Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const repoScore = analysis?.overall_score ?? 0;
  const auditScore = audit?.overall_score ?? 0;
  const complianceScore = extractComplianceScore(analysis);
  const overallScore = Math.round(repoScore * 0.4 + auditScore * 0.35 + complianceScore * 0.25);

  const criticalGaps = extractCriticalGaps(analysis);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Development Health
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyzeRepo.mutate({ repositoryUrl })}
              disabled={analyzeRepo.isPending}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${analyzeRepo.isPending ? "animate-spin" : ""}`} />
              Analyze
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAudit.mutate()}
              disabled={runAudit.isPending}
            >
              <Shield className="h-3.5 w-3.5 mr-1" />
              Audit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold tabular-nums">
            {overallScore}%
          </div>
          <div className="flex-1">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  overallScore >= 80
                    ? "bg-status-healthy"
                    : overallScore >= 50
                      ? "bg-status-warning"
                      : "bg-status-critical"
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall Health Score</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <HealthCard title="Spec Alignment" icon={FileCheck} score={repoScore} label="from analysis" />
          <HealthCard title="Standards" icon={Shield} score={complianceScore} label="compliance" />
          <HealthCard title="Code Quality" icon={Code2} score={auditScore} label="audit score" />
        </div>

        {criticalGaps.length > 0 && (
          <div className="rounded-lg border border-status-critical/30 bg-status-critical/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-status-critical" />
              <span className="text-sm font-medium">Critical Gaps</span>
            </div>
            <ul className="space-y-1">
              {criticalGaps.slice(0, 3).map((gap, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function extractComplianceScore(analysis: ReturnType<typeof useRepositoryAnalysis>["data"]): number {
  if (!analysis?.standards_compliance) return 0;
  const compliance = analysis.standards_compliance as Record<string, unknown>;
  return typeof compliance.score === "number" ? compliance.score : 0;
}

function extractCriticalGaps(analysis: ReturnType<typeof useRepositoryAnalysis>["data"]): string[] {
  if (!analysis?.gap_analysis) return [];
  const gaps = analysis.gap_analysis as Record<string, unknown>;
  const items = gaps.critical_gaps ?? gaps.gaps ?? [];
  if (!Array.isArray(items)) return [];
  return items.map((g) => (typeof g === "string" ? g : String((g as Record<string, unknown>).description ?? g)));
}
