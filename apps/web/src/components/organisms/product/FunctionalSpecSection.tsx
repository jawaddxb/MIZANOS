"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { useRepositoryAnalysis, useAnalyzeRepository } from "@/hooks/queries/useRepositoryAnalysis";
import {
  CheckCircle2,
  Circle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FunctionalSpecSectionProps {
  productId: string;
  repositoryUrl: string;
  specificationId?: string;
}

type FeatureStatus = "implemented" | "partial" | "missing";

interface InventoryItem {
  name: string;
  status: FeatureStatus;
  path?: string;
  notes?: string;
}

const STATUS_CONFIG: Record<FeatureStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  implemented: { icon: CheckCircle2, color: "text-status-healthy", label: "Implemented" },
  partial: { icon: Circle, color: "text-status-warning", label: "Partial" },
  missing: { icon: XCircle, color: "text-status-critical", label: "Missing" },
};

export function FunctionalSpecSection({
  productId,
  repositoryUrl,
}: FunctionalSpecSectionProps) {
  const { data: analysis, isLoading } = useRepositoryAnalysis(productId);
  const analyzeRepo = useAnalyzeRepository(productId);
  const [activeTab, setActiveTab] = useState<"inventory" | "alignment">("inventory");
  const [showViolations, setShowViolations] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Functional Alignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No repository analysis available</p>
          <Button
            size="sm"
            onClick={() => analyzeRepo.mutate({ repositoryUrl })}
            disabled={analyzeRepo.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${analyzeRepo.isPending ? "animate-spin" : ""}`} />
            Analyze Repository
          </Button>
        </CardContent>
      </Card>
    );
  }

  const inventory = parseInventory(analysis.functional_inventory);
  const compliance = parseCompliance(analysis.standards_compliance);
  const gaps = parseGaps(analysis.gap_analysis);
  const critique = parseCritique(analysis.code_critique);

  const counts = {
    implemented: inventory.filter((i) => i.status === "implemented").length,
    partial: inventory.filter((i) => i.status === "partial").length,
    missing: inventory.filter((i) => i.status === "missing").length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Functional Alignment</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzeRepo.mutate({ repositoryUrl })}
            disabled={analyzeRepo.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${analyzeRepo.isPending ? "animate-spin" : ""}`} />
            Re-analyze
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatusSummary counts={counts} />

        <div className="flex gap-1 border-b">
          {(["inventory", "alignment"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "inventory" ? "Code Inventory" : "Spec Alignment"}
            </button>
          ))}
        </div>

        {activeTab === "inventory" ? (
          <InventoryTable items={inventory} />
        ) : (
          <AlignmentView gaps={gaps} compliance={compliance} critique={critique} showViolations={showViolations} onToggleViolations={() => setShowViolations(!showViolations)} />
        )}
      </CardContent>
    </Card>
  );
}

function StatusSummary({ counts }: { counts: Record<FeatureStatus, number> }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {(Object.entries(counts) as [FeatureStatus, number][]).map(([status, count]) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        return (
          <div key={status} className="flex items-center gap-2 rounded-lg border p-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className="text-lg font-semibold tabular-nums">{count}</span>
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function InventoryTable({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No features analyzed</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const config = STATUS_CONFIG[item.status];
        const Icon = config.icon;
        return (
          <div key={i} className="flex items-center gap-2 rounded p-2 hover:bg-accent/50">
            <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
            <span className="text-sm flex-1">{item.name}</span>
            {item.path && (
              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                {item.path}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AlignmentView({
  gaps,
  compliance,
  critique,
  showViolations,
  onToggleViolations,
}: {
  gaps: string[];
  compliance: { score: number; violations: string[] };
  critique: { strengths: string[]; improvements: string[] };
  showViolations: boolean;
  onToggleViolations: () => void;
}) {
  return (
    <div className="space-y-4">
      {gaps.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Gap Analysis</h4>
          <ul className="space-y-1">
            {gaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <XCircle className="h-3.5 w-3.5 text-status-critical mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Standards Compliance</h4>
          <Badge variant={compliance.score >= 80 ? "default" : "secondary"}>
            {compliance.score}%
          </Badge>
        </div>
        {compliance.violations.length > 0 && (
          <button onClick={onToggleViolations} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1">
            {showViolations ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {compliance.violations.length} violations
          </button>
        )}
        {showViolations && (
          <ul className="space-y-1 ml-4">
            {compliance.violations.map((v, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 text-status-warning mt-0.5 shrink-0" />
                {v}
              </li>
            ))}
          </ul>
        )}
      </div>

      {(critique.strengths.length > 0 || critique.improvements.length > 0) && (
        <div>
          <h4 className="text-sm font-medium mb-2">Code Quality</h4>
          {critique.strengths.length > 0 && (
            <div className="mb-2">
              {critique.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-status-healthy mt-0.5 shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          )}
          {critique.improvements.map((imp, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 text-status-warning mt-0.5 shrink-0" />
              {imp}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function parseInventory(data: unknown): InventoryItem[] {
  if (!data || !Array.isArray(data)) return [];
  return data.map((item) => ({
    name: String((item as Record<string, unknown>).name ?? "Unknown"),
    status: ((item as Record<string, unknown>).status as FeatureStatus) ?? "missing",
    path: (item as Record<string, unknown>).path as string | undefined,
    notes: (item as Record<string, unknown>).notes as string | undefined,
  }));
}

function parseCompliance(data: unknown): { score: number; violations: string[] } {
  if (!data || typeof data !== "object") return { score: 0, violations: [] };
  const obj = data as Record<string, unknown>;
  const violations = Array.isArray(obj.violations)
    ? obj.violations.map((v) => (typeof v === "string" ? v : String((v as Record<string, unknown>).message ?? v)))
    : [];
  return { score: typeof obj.score === "number" ? obj.score : 0, violations };
}

function parseGaps(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  const items = obj.gaps ?? obj.critical_gaps ?? [];
  if (!Array.isArray(items)) return [];
  return items.map((g) => (typeof g === "string" ? g : String((g as Record<string, unknown>).description ?? g)));
}

function parseCritique(data: unknown): { strengths: string[]; improvements: string[] } {
  if (!data || typeof data !== "object") return { strengths: [], improvements: [] };
  const obj = data as Record<string, unknown>;
  const toStrings = (arr: unknown) => (Array.isArray(arr) ? arr.map(String) : []);
  return {
    strengths: toStrings(obj.strengths),
    improvements: toStrings(obj.improvements ?? obj.recommendations),
  };
}
