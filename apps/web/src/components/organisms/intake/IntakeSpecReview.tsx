"use client";

import * as React from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { Progress } from "@/components/atoms/feedback/Progress";
import { Button } from "@/components/molecules/buttons/Button";
import { EditableListItem } from "@/components/molecules/intake/EditableListItem";
import { EditableText } from "@/components/molecules/intake/EditableText";
import { CustomInstructionsInput } from "@/components/molecules/intake/CustomInstructionsInput";
import type { GeneratedSpec, FunctionalSpec, IntakeSourceData } from "./types";

interface IntakeSpecReviewProps {
  generatedSpec: GeneratedSpec | null;
  onSpecChange: (spec: GeneratedSpec) => void;
  sources: IntakeSourceData;
  projectName: string;
  isGenerating: boolean;
  onGenerate: () => void;
  customInstructions: string;
  onCustomInstructionsChange: (value: string) => void;
}

export function IntakeSpecReview({
  generatedSpec, onSpecChange, sources, projectName, isGenerating, onGenerate,
  customInstructions, onCustomInstructionsChange,
}: IntakeSpecReviewProps) {
  const [editingSummary, setEditingSummary] = React.useState(false);
  const [summaryDraft, setSummaryDraft] = React.useState(generatedSpec?.summary ?? "");

  React.useEffect(() => {
    if (generatedSpec?.summary) setSummaryDraft(generatedSpec.summary);
  }, [generatedSpec?.summary]);

  const commitSummary = () => {
    if (generatedSpec) onSpecChange({ ...generatedSpec, summary: summaryDraft });
    setEditingSummary(false);
  };

  const updateList = (key: "features" | "qaChecklist", idx: number, value: string) => {
    if (!generatedSpec) return;
    const next = [...generatedSpec[key]];
    next[idx] = value;
    onSpecChange({ ...generatedSpec, [key]: next });
  };

  const removeFromList = (key: "features" | "qaChecklist", idx: number) => {
    if (!generatedSpec) return;
    onSpecChange({ ...generatedSpec, [key]: generatedSpec[key].filter((_, i) => i !== idx) });
  };

  const updateFunctionalList = (key: keyof FunctionalSpec, idx: number, value: string) => {
    if (!generatedSpec) return;
    const next = [...generatedSpec.functionalSpec[key]];
    next[idx] = value;
    onSpecChange({ ...generatedSpec, functionalSpec: { ...generatedSpec.functionalSpec, [key]: next } });
  };

  const removeFunctionalItem = (key: keyof FunctionalSpec, idx: number) => {
    if (!generatedSpec) return;
    onSpecChange({
      ...generatedSpec,
      functionalSpec: {
        ...generatedSpec.functionalSpec,
        [key]: generatedSpec.functionalSpec[key].filter((_, i) => i !== idx),
      },
    });
  };

  const updateTechnicalList = (key: "dataModels" | "integrations" | "nonFunctionalRequirements", idx: number, value: string) => {
    if (!generatedSpec) return;
    const next = [...generatedSpec.technicalSpec[key]];
    next[idx] = value;
    onSpecChange({ ...generatedSpec, technicalSpec: { ...generatedSpec.technicalSpec, [key]: next } });
  };

  const removeTechnicalItem = (key: "dataModels" | "integrations" | "nonFunctionalRequirements", idx: number) => {
    if (!generatedSpec) return;
    onSpecChange({
      ...generatedSpec,
      technicalSpec: {
        ...generatedSpec.technicalSpec,
        [key]: generatedSpec.technicalSpec[key].filter((_, i) => i !== idx),
      },
    });
  };

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium">Generating specification...</p>
            <Progress value={50} className="h-2 w-64" />
            <p className="text-xs text-muted-foreground">AI is analyzing your sources and creating a specification.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!generatedSpec) {
    return (
      <div className="space-y-6">
        <CustomInstructionsInput value={customInstructions} onChange={onCustomInstructionsChange} />
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Ready to generate specification</p>
              <p className="max-w-md text-center text-sm text-muted-foreground">
                Click below to have AI analyze your sources and create a project specification.
              </p>
              <Button onClick={onGenerate} leftIcon={<Sparkles className="h-4 w-4" />}>Generate Spec</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderEditableList = (items: string[], title: string, onUpdate: (idx: number, v: string) => void, onRemove: (idx: number) => void) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="rounded-md border px-3 py-2">
              <EditableListItem value={item} onSave={(v) => onUpdate(idx, v)} onRemove={() => onRemove(idx)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground italic">None generated</p>
      )}
    </div>
  );

  const renderTopLevelList = (key: "features" | "qaChecklist", title: string) => (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          {title}
          <Badge variant="secondary" className="text-xs">{generatedSpec[key].length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {generatedSpec[key].map((item, idx) => (
            <li key={idx} className="rounded-md border px-3 py-2">
              <EditableListItem value={item} onSave={(v) => updateList(key, idx, v)} onRemove={() => removeFromList(key, idx)} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  const { functionalSpec, technicalSpec } = generatedSpec;
  const hasFunctional = functionalSpec.userStories.length > 0 || functionalSpec.businessRules.length > 0 || functionalSpec.acceptanceCriteria.length > 0;
  const hasTechnical = technicalSpec.architecture || technicalSpec.dataModels.length > 0 || technicalSpec.integrations.length > 0 || technicalSpec.nonFunctionalRequirements.length > 0;

  return (
    <div className="space-y-6">
      <CustomInstructionsInput value={customInstructions} onChange={onCustomInstructionsChange} />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Summary</CardTitle>
            <Button size="sm" variant="ghost" onClick={onGenerate} leftIcon={<RefreshCw className="h-3 w-3" />}>Regenerate</Button>
          </div>
        </CardHeader>
        <CardContent>
          {editingSummary ? (
            <div className="space-y-2">
              <BaseTextarea value={summaryDraft} onChange={(e) => setSummaryDraft(e.target.value)} className="min-h-[100px]" />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditingSummary(false)}>Cancel</Button>
                <Button size="sm" onClick={commitSummary}>Save</Button>
              </div>
            </div>
          ) : (
            <button type="button" className="w-full text-left text-sm leading-relaxed hover:bg-muted/50 rounded-md p-2 -m-2" onClick={() => setEditingSummary(true)}>
              {generatedSpec.summary}
            </button>
          )}
        </CardContent>
      </Card>

      {renderTopLevelList("features", "Features")}

      {hasFunctional && (
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-lg">Functional Specification</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {renderEditableList(functionalSpec.userStories, "User Stories", (i, v) => updateFunctionalList("userStories", i, v), (i) => removeFunctionalItem("userStories", i))}
            {renderEditableList(functionalSpec.businessRules, "Business Rules", (i, v) => updateFunctionalList("businessRules", i, v), (i) => removeFunctionalItem("businessRules", i))}
            {renderEditableList(functionalSpec.acceptanceCriteria, "Acceptance Criteria", (i, v) => updateFunctionalList("acceptanceCriteria", i, v), (i) => removeFunctionalItem("acceptanceCriteria", i))}
          </CardContent>
        </Card>
      )}

      {hasTechnical && (
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-lg">Technical Specification</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {technicalSpec.architecture && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Architecture</p>
                <EditableText value={technicalSpec.architecture} onSave={(v) => onSpecChange({ ...generatedSpec, technicalSpec: { ...technicalSpec, architecture: v } })} />
              </div>
            )}
            {renderEditableList(technicalSpec.dataModels, "Data Models", (i, v) => updateTechnicalList("dataModels", i, v), (i) => removeTechnicalItem("dataModels", i))}
            {renderEditableList(technicalSpec.integrations, "Integrations", (i, v) => updateTechnicalList("integrations", i, v), (i) => removeTechnicalItem("integrations", i))}
            {renderEditableList(technicalSpec.nonFunctionalRequirements, "Non-Functional Requirements", (i, v) => updateTechnicalList("nonFunctionalRequirements", i, v), (i) => removeTechnicalItem("nonFunctionalRequirements", i))}
          </CardContent>
        </Card>
      )}

      {generatedSpec.techStack.length > 0 && (
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-lg">Tech Stack</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {generatedSpec.techStack.map((tech) => (<Badge key={tech} variant="outline">{tech}</Badge>))}
            </div>
          </CardContent>
        </Card>
      )}

      {renderTopLevelList("qaChecklist", "QA Checklist")}
    </div>
  );
}
