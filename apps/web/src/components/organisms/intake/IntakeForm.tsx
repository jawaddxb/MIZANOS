"use client";

import * as React from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils/cn";
import { Progress } from "@/components/atoms/feedback/Progress";
import { Button } from "@/components/molecules/buttons/Button";
import { useIntakeSubmit } from "@/hooks/features/useIntakeSubmit";
import { aiRepository } from "@/lib/api/repositories";

import { IntakeBasicInfo } from "./IntakeBasicInfo";
import { IntakeSourcesStep } from "./IntakeSourcesStep";
import { IntakeSpecReview } from "./IntakeSpecReview";
import { IntakeConfirmation } from "./IntakeConfirmation";
import {
  INTAKE_STEPS,
  STEP_LABELS,
  type IntakeStep,
  type IntakeFormData,
  type GeneratedSpec,
  isTextLikeSpecFile,
} from "./types";

function buildSourceSummary(sources: IntakeFormData["sources"]): string {
  const parts: string[] = [];
  if (sources.pasteContent.trim()) {
    parts.push(`Pasted content:\n${sources.pasteContent.slice(0, 2000)}`);
  }
  if (sources.markdownContent.trim()) {
    parts.push(`Markdown notes:\n${sources.markdownContent.slice(0, 2000)}`);
  }
  for (const site of sources.scrapedWebsites) {
    parts.push(`Website (${site.url}):\n${site.markdown?.slice(0, 1000) || site.aiSummary || "(no content)"}`);
  }
  for (const note of sources.audioNotes) {
    if (note.transcription) {
      parts.push(`Audio note transcription:\n${note.transcription}`);
    }
  }
  if (sources.documents.length > 0) {
    parts.push(`Uploaded documents: ${sources.documents.map((d) => d.name).join(", ")}`);
  }
  if (sources.githubData) {
    parts.push(`GitHub repository: ${sources.githubData.repositoryUrl}`);
  }
  return parts.join("\n\n");
}

export function IntakeForm() {
  const [currentStep, setCurrentStep] = React.useState<IntakeStep>("basic-info");
  const stepIndex = INTAKE_STEPS.indexOf(currentStep);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const [formData, setFormData] = React.useState<IntakeFormData>({
    projectName: "",
    pillar: "",
    sourceType: "greenfield",
    description: "",
    sources: {
      documents: [],
      audioNotes: [],
      markdownContent: "",
      pasteContent: "",
      scrapedWebsites: [],
      githubData: null,
    },
    generatedSpec: null,
  });

  const { isSubmitting, submitProgress, submitLabel, handleSubmit } = useIntakeSubmit();

  const canProceedFromBasicInfo =
    formData.projectName.trim() !== "" && formData.pillar !== "";

  const hasAnySources =
    formData.sources.documents.length > 0 ||
    formData.sources.audioNotes.length > 0 ||
    formData.sources.markdownContent.trim().length > 0 ||
    formData.sources.pasteContent.trim().length > 0 ||
    formData.sources.scrapedWebsites.length > 0 ||
    !!formData.sources.githubData;

  const goNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < INTAKE_STEPS.length) setCurrentStep(INTAKE_STEPS[nextIdx]);
  };

  const goBack = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) setCurrentStep(INTAKE_STEPS[prevIdx]);
  };

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case "basic-info": return canProceedFromBasicInfo;
      case "sources": return hasAnySources;
      case "spec-review": return formData.generatedSpec !== null;
      default: return false;
    }
  };

  const updateSources = React.useCallback(
    (partial: Partial<IntakeFormData["sources"]>) => {
      setFormData((prev) => ({
        ...prev,
        sources: { ...prev.sources, ...partial },
      }));
    },
    [],
  );

  const handleGenerateSpec = React.useCallback(async () => {
    setIsGenerating(true);
    try {
      const sourceSummary = buildSourceSummary(formData.sources);
      const prompt = [
        `Generate a product specification for "${formData.projectName}".`,
        formData.description ? `Description: ${formData.description}` : "",
        sourceSummary ? `\nSource material:\n${sourceSummary}` : "",
        "\nRespond ONLY with valid JSON in this exact format (no markdown, no code fences):",
        '{"summary":"...","features":["..."],"techStack":["..."],"qaChecklist":["..."]}',
      ]
        .filter(Boolean)
        .join("\n");

      const session = await aiRepository.createSession();
      const response = await aiRepository.sendMessage(session.id, prompt);
      const content = response.content ?? "";

      let parsed: GeneratedSpec;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = {
          summary: content.slice(0, 500),
          features: ["(AI response could not be parsed — review raw output above)"],
          techStack: [],
          qaChecklist: [],
        };
      }

      setFormData((prev) => ({ ...prev, generatedSpec: parsed }));
      toast.success("Specification generated successfully");
    } catch {
      toast.error("Failed to generate specification");
    } finally {
      setIsGenerating(false);
    }
  }, [formData.projectName, formData.description, formData.sources]);

  const progressPercent = ((stepIndex + 1) / INTAKE_STEPS.length) * 100;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Project Intake</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new project by providing specification documents, notes, or pasted content.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator steps={INTAKE_STEPS} currentIndex={stepIndex} onStepClick={setCurrentStep} />
      <Progress value={progressPercent} className="h-1" />

      {/* Step content */}
      {currentStep === "basic-info" && (
        <IntakeBasicInfo
          projectName={formData.projectName}
          onProjectNameChange={(v) => setFormData((p) => ({ ...p, projectName: v }))}
          description={formData.description}
          onDescriptionChange={(v) => setFormData((p) => ({ ...p, description: v }))}
          pillar={formData.pillar}
          onPillarChange={(v) => setFormData((p) => ({ ...p, pillar: v }))}
          sourceType={formData.sourceType}
          onSourceTypeChange={(v) => setFormData((p) => ({ ...p, sourceType: v }))}
          errors={{}}
        />
      )}
      {currentStep === "sources" && (
        <IntakeSourcesStep
          documents={formData.sources.documents}
          onDocumentsChange={(f) => updateSources({ documents: f })}
          audioNotes={formData.sources.audioNotes}
          onAudioNotesChange={(n) => updateSources({ audioNotes: n })}
          markdownContent={formData.sources.markdownContent}
          onMarkdownContentChange={(v) => updateSources({ markdownContent: v })}
          pasteContent={formData.sources.pasteContent}
          onPasteContentChange={(v) => updateSources({ pasteContent: v })}
          scrapedWebsites={formData.sources.scrapedWebsites}
          onScrapedWebsitesChange={(s) => updateSources({ scrapedWebsites: s })}
          githubData={formData.sources.githubData}
          onGitHubDataChange={(d) => updateSources({ githubData: d })}
        />
      )}
      {currentStep === "spec-review" && (
        <IntakeSpecReview
          generatedSpec={formData.generatedSpec}
          onSpecChange={(spec) => setFormData((p) => ({ ...p, generatedSpec: spec }))}
          sources={formData.sources}
          projectName={formData.projectName}
          isGenerating={isGenerating}
          onGenerate={handleGenerateSpec}
        />
      )}
      {currentStep === "confirmation" && (
        <IntakeConfirmation
          formData={formData}
          isSubmitting={isSubmitting}
          submitProgress={submitProgress}
          submitLabel={submitLabel}
          onSubmit={() => handleSubmit(formData)}
        />
      )}

      {/* Navigation */}
      {!isSubmitting && (
        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {currentStep !== "confirmation" && (
            <Button onClick={goNext} disabled={!canGoNext()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function StepIndicator({
  steps,
  currentIndex,
  onStepClick,
}: {
  steps: readonly IntakeStep[];
  currentIndex: number;
  onStepClick: (step: IntakeStep) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => (
        <button
          key={step}
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            idx === currentIndex && "bg-primary text-primary-foreground",
            idx < currentIndex && "text-green-600",
            idx > currentIndex && "text-muted-foreground",
          )}
          onClick={() => { if (idx <= currentIndex) onStepClick(steps[idx]); }}
          disabled={idx > currentIndex}
        >
          {idx < currentIndex ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full border text-xs">
              {idx + 1}
            </span>
          )}
          <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
        </button>
      ))}
    </div>
  );
}
