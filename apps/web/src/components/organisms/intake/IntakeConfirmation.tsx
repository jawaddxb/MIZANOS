"use client";

import * as React from "react";
import {
  CheckCircle2,
  FileText,
  Mic,
  Code,
  ClipboardPaste,
  Globe,
  Github,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Progress } from "@/components/atoms/feedback/Progress";
import { Button } from "@/components/molecules/buttons/Button";

import type { IntakeFormData } from "./types";
import { PILLAR_OPTIONS, SOURCE_TYPE_OPTIONS } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface IntakeConfirmationProps {
  formData: IntakeFormData;
  isSubmitting: boolean;
  submitProgress: number;
  submitLabel: string;
  onSubmit: () => void;
}

// ---------------------------------------------------------------------------
// Summary row helper
// ---------------------------------------------------------------------------
function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 text-sm">
      <span className="w-32 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function IntakeConfirmation({
  formData,
  isSubmitting,
  submitProgress,
  submitLabel,
  onSubmit,
}: IntakeConfirmationProps) {
  const { projectName, pillar, sourceType, description, sources, generatedSpec } = formData;

  const pillarLabel = PILLAR_OPTIONS.find((o) => o.value === pillar)?.label ?? pillar;
  const sourceTypeLabel =
    SOURCE_TYPE_OPTIONS.find((o) => o.value === sourceType)?.label ?? sourceType;

  // Compute source counts
  const sourceSummary: Array<{ icon: React.ElementType; label: string }> = [];
  if (sources.documents.length > 0) {
    sourceSummary.push({
      icon: FileText,
      label: `${sources.documents.length} document${sources.documents.length > 1 ? "s" : ""}`,
    });
  }
  if (sources.audioNotes.length > 0) {
    sourceSummary.push({
      icon: Mic,
      label: `${sources.audioNotes.length} audio note${sources.audioNotes.length > 1 ? "s" : ""}`,
    });
  }
  if (sources.markdownContent.trim()) {
    sourceSummary.push({ icon: Code, label: "Markdown content" });
  }
  if (sources.pasteContent.trim()) {
    sourceSummary.push({ icon: ClipboardPaste, label: "Pasted content" });
  }
  if (sources.scrapedWebsites.length > 0) {
    sourceSummary.push({
      icon: Globe,
      label: `${sources.scrapedWebsites.length} website${sources.scrapedWebsites.length > 1 ? "s" : ""}`,
    });
  }
  if (sources.githubData) {
    sourceSummary.push({ icon: Github, label: "GitHub repository" });
  }

  // ---- Submitting progress overlay ----
  if (isSubmitting) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium">{submitLabel}</p>
            <Progress value={submitProgress} className="h-2 w-64" />
            <p className="text-xs text-muted-foreground">
              Please wait while we set up your project...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project details summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Project Summary</CardTitle>
          <CardDescription>Review the information below before submitting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryRow label="Project Name">{projectName}</SummaryRow>
          {description && <SummaryRow label="Description">{description}</SummaryRow>}
          <SummaryRow label="Pillar">
            <Badge variant="outline">{pillarLabel}</Badge>
          </SummaryRow>
          <SummaryRow label="Source Type">
            <Badge variant="secondary">{sourceTypeLabel}</Badge>
          </SummaryRow>
        </CardContent>
      </Card>

      {/* Sources summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            Sources
            <Badge variant="secondary" className="text-xs">
              {sourceSummary.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sourceSummary.length > 0 ? (
            <ul className="space-y-2">
              {sourceSummary.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No sources added.</p>
          )}
        </CardContent>
      </Card>

      {/* Generated spec summary */}
      {generatedSpec && (
        <Card className="border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Generated Specification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label="Features">
              {generatedSpec.features.length} feature{generatedSpec.features.length !== 1 ? "s" : ""}
            </SummaryRow>
            <SummaryRow label="Tech Stack">
              <div className="flex flex-wrap gap-1">
                {generatedSpec.techStack.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </SummaryRow>
            <SummaryRow label="QA Checks">
              {generatedSpec.qaChecklist.length} check{generatedSpec.qaChecklist.length !== 1 ? "s" : ""}
            </SummaryRow>
          </CardContent>
        </Card>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={onSubmit}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Create Project
        </Button>
      </div>
    </div>
  );
}
