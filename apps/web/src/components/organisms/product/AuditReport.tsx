"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { Loader2, ShieldCheck, AlertTriangle, Play } from "lucide-react";
import { useLatestAudit } from "@/hooks/queries/useAuditHistory";
import { auditRepository } from "@/lib/api/repositories";
import type { JsonValue } from "@/lib/types";

interface AuditReportProps {
  productId: string;
}

interface AuditCategory {
  name: string;
  score: number;
  maxScore: number;
}

interface AuditIssue {
  category: string;
  severity: string;
  message: string;
}

function parseCategories(categories: JsonValue): AuditCategory[] {
  if (!categories || typeof categories !== "object" || Array.isArray(categories)) return [];
  return Object.entries(categories as Record<string, unknown>).map(([name, val]) => {
    const entry = val as Record<string, number> | undefined;
    return {
      name,
      score: entry?.score ?? 0,
      maxScore: entry?.maxScore ?? entry?.max_score ?? 100,
    };
  });
}

function parseIssues(issues: JsonValue): AuditIssue[] {
  if (!Array.isArray(issues)) return [];
  return (issues as Record<string, string>[]).map((i) => ({
    category: i.category ?? "General",
    severity: i.severity ?? "info",
    message: i.message ?? "",
  }));
}

const SEVERITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
  info: "outline",
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-status-healthy";
  if (score >= 60) return "text-status-warning";
  return "text-status-critical";
}

export function AuditReport({ productId }: AuditReportProps) {
  const { data: audit, isLoading } = useLatestAudit(productId);
  const queryClient = useQueryClient();

  const runAudit = useMutation({
    mutationFn: () => auditRepository.runAudit(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audits", productId] });
      toast.success("Audit completed");
    },
    onError: (error: Error) => {
      toast.error("Audit failed: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const categories = audit ? parseCategories(audit.categories) : [];
  const issues = audit ? parseIssues(audit.issues) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Audit Report
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => runAudit.mutate()}
          disabled={runAudit.isPending}
        >
          {runAudit.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          Run Audit
        </Button>
      </div>

      {!audit && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="font-medium">No audit results yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Run an audit to check your product health
            </p>
          </CardContent>
        </Card>
      )}

      {audit && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className={`text-4xl font-bold ${scoreColor(audit.overall_score)}`}>
                  {audit.overall_score}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(audit.run_at).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{cat.name.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cat.score / cat.maxScore >= 0.8
                              ? "bg-status-healthy"
                              : cat.score / cat.maxScore >= 0.6
                                ? "bg-status-warning"
                                : "bg-status-critical"
                          }`}
                          style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-12 text-right">
                        {cat.score}/{cat.maxScore}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Issues ({issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded border p-2"
                  >
                    <Badge
                      variant={SEVERITY_VARIANT[issue.severity] ?? "outline"}
                      className="text-[10px] shrink-0 mt-0.5"
                    >
                      {issue.severity}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm">{issue.message}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {issue.category.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
