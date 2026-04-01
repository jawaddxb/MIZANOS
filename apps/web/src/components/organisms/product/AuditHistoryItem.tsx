"use client";

import { useState } from "react";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { HealthScore } from "@/components/molecules/indicators/HealthScore";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/atoms/layout/Collapsible";
import type { Audit, JsonValue } from "@/lib/types";
import {
  ChevronDown,
  ChevronUp,
  FileCode,
  FolderTree,
  Shield,
  Gauge,
  Trash2,
} from "lucide-react";

interface AuditHistoryItemProps {
  audit: Audit;
  isLatest?: boolean;
  canDelete?: boolean;
  onDelete?: (auditId: string) => void;
  isDeleting?: boolean;
}

interface AuditCategories {
  style: number;
  architecture: number;
  security: number;
  performance: number;
}

interface AuditIssue {
  severity: string;
  message?: string;
  file?: string;
  rule?: string;
}

const CATEGORY_ICONS: Record<string, typeof FileCode> = {
  style: FileCode,
  architecture: FolderTree,
  security: Shield,
  performance: Gauge,
};

function parseCategories(categories: JsonValue): AuditCategories {
  if (
    categories &&
    typeof categories === "object" &&
    !Array.isArray(categories)
  ) {
    return {
      style: (categories.style as number) ?? 0,
      architecture: (categories.architecture as number) ?? 0,
      security: (categories.security as number) ?? 0,
      performance: (categories.performance as number) ?? 0,
    };
  }
  return { style: 0, architecture: 0, security: 0, performance: 0 };
}

function parseFrameworks(issues: JsonValue): Record<string, string[]> {
  if (issues && typeof issues === "object" && !Array.isArray(issues)) {
    const fw = (issues as Record<string, unknown>).frameworks;
    if (fw && typeof fw === "object" && !Array.isArray(fw)) {
      return fw as Record<string, string[]>;
    }
  }
  return {};
}

function parseIssues(issues: JsonValue): AuditIssue[] {
  if (Array.isArray(issues)) {
    return issues as unknown as AuditIssue[];
  }
  return [];
}

function AuditHistoryItem({ audit, isLatest, canDelete, onDelete, isDeleting }: AuditHistoryItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categories = parseCategories(audit.categories);
  const issues = parseIssues(audit.issues);
  const frameworks = parseFrameworks(audit.issues);
  const allTechTags = Object.entries(frameworks).flatMap(([, tags]) => Array.isArray(tags) ? tags : []);
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const runDate = new Date(audit.run_at);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-secondary/50"
          >
            <div className="flex items-center gap-4">
              <HealthScore score={audit.overall_score} size="sm" showLabel={false} />
              <div className="text-left">
                <p className="text-sm font-medium">
                  {runDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {runDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {isLatest && (
                <Badge variant="secondary" className="ml-2">
                  Latest
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Issues: {issues.length}</span>
                {criticalCount > 0 && (
                  <span className="text-destructive">
                    Critical: {criticalCount}
                  </span>
                )}
              </div>
              {canDelete && onDelete && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={(e) => { e.stopPropagation(); onDelete(audit.id); }}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete audit"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 border-t bg-secondary/20 space-y-4">
            {allTechTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allTechTags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-4 gap-4">
              {(
                Object.entries(categories) as [
                  keyof AuditCategories,
                  number,
                ][]
              ).map(([key, value]) => {
                const Icon = CATEGORY_ICONS[key] ?? FileCode;
                const categoryFrameworks = key === "style" ? [...(frameworks.frontend ?? []), ...(frameworks.backend ?? [])]
                  : key === "architecture" ? [...(frameworks.languages ?? []), ...(frameworks.database ?? [])]
                  : key === "security" ? [...(frameworks.infrastructure ?? [])]
                  : [...(frameworks.testing ?? []), ...(frameworks.styling ?? [])];
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{key}:</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                    {categoryFrameworks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 ml-6">
                        {categoryFrameworks.map((t) => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {issues.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Issues ({issues.length})
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {issues.slice(0, 10).map((issue, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs p-2 rounded bg-background"
                    >
                      <Badge
                        variant={
                          issue.severity === "critical"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] shrink-0"
                      >
                        {issue.severity}
                      </Badge>
                      <div className="min-w-0">
                        {issue.rule && (
                          <span className="font-medium">{issue.rule}: </span>
                        )}
                        <span className="text-muted-foreground">
                          {issue.message ?? "No description"}
                        </span>
                        {issue.file && (
                          <p className="text-muted-foreground/70 truncate mt-0.5">
                            {issue.file}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {issues.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{issues.length - 10} more issues
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export { AuditHistoryItem };
export type { AuditHistoryItemProps };
