"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { EnhancedMarkdownViewer } from "@/components/molecules/display/EnhancedMarkdownViewer";
import type { EvaluationResult, EvaluationDocument } from "@/lib/types";
import { Download, RotateCcw, FileText } from "lucide-react";

interface EvaluationPreviewProps {
  result: EvaluationResult;
  onReset: () => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-green-500/10 text-green-700 border-green-200";
  if (score >= 60) return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
  if (score >= 40) return "bg-orange-500/10 text-orange-700 border-orange-200";
  return "bg-red-500/10 text-red-700 border-red-200";
}

function downloadMarkdown(doc: EvaluationDocument) {
  const blob = new Blob([doc.content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.slug}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAll(docs: EvaluationDocument[]) {
  const combined = docs
    .sort((a, b) => a.order - b.order)
    .map((d) => d.content)
    .join("\n\n---\n\n");
  const blob = new Blob([combined], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "evaluation-report.md";
  a.click();
  URL.revokeObjectURL(url);
}

function EvaluationPreview({ result, onReset }: EvaluationPreviewProps) {
  const [activeTab, setActiveTab] = useState(0);
  const sorted = [...result.documents].sort((a, b) => a.order - b.order);
  const activeDoc = sorted[activeTab];

  return (
    <div className="space-y-4">
      {/* Score + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg border px-4 py-2 ${scoreColor(result.summary_score)}`}>
            <span className="text-2xl font-bold tabular-nums">{result.summary_score}</span>
            <span className="text-sm ml-1">/100</span>
          </div>
          <div>
            <p className="text-sm font-medium">{result.repo_path}</p>
            <p className="text-xs text-muted-foreground">
              {result.tech_stack.frameworks.join(", ") || "No frameworks"} &middot;{" "}
              {result.structure.total_files.toLocaleString()} files &middot;{" "}
              {result.structure.total_loc.toLocaleString()} LOC
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            New Evaluation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadAll(result.documents)}
          >
            <Download className="h-4 w-4 mr-1" />
            Download All
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 overflow-x-auto">
              {sorted.map((doc, idx) => (
                <button
                  key={doc.slug}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                    idx === activeTab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {doc.title}
                </button>
              ))}
            </div>
            {activeDoc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadMarkdown(activeDoc)}
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeDoc && (
            <EnhancedMarkdownViewer
              content={activeDoc.content}
              showToc
            />
          )}
        </CardContent>
      </Card>

      {/* Lovable badge */}
      {result.has_lovable_project && (
        <Badge variant="secondary">Lovable/Supabase project detected</Badge>
      )}
    </div>
  );
}

export { EvaluationPreview };
export type { EvaluationPreviewProps };
