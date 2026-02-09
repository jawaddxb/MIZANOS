"use client";

import * as React from "react";
import { Sparkles, Loader2, RefreshCw, Pencil, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { Progress } from "@/components/atoms/feedback/Progress";
import { Button } from "@/components/molecules/buttons/Button";
import type { GeneratedSpec, IntakeSourceData } from "./types";

interface IntakeSpecReviewProps {
  generatedSpec: GeneratedSpec | null;
  onSpecChange: (spec: GeneratedSpec) => void;
  sources: IntakeSourceData;
  projectName: string;
  isGenerating: boolean;
  onGenerate: () => void;
}

function EditableListItem({ value, onSave, onRemove }: {
  value: string; onSave: (next: string) => void; onRemove: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const commit = () => {
    const trimmed = draft.trim();
    trimmed.length === 0 ? onRemove() : onSave(trimmed);
    setEditing(false);
  };
  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" value={draft}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commit()} autoFocus />
        <button type="button" onClick={commit} className="text-green-600"><Check className="h-4 w-4" /></button>
      </div>
    );
  }
  return (
    <div className="group flex items-center justify-between text-sm">
      <span>{value}</span>
      <button type="button" onClick={() => setEditing(true)} className="opacity-0 transition-opacity group-hover:opacity-100">
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}

export function IntakeSpecReview({ generatedSpec, onSpecChange, sources, projectName, isGenerating, onGenerate }: IntakeSpecReviewProps) {
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
    );
  }

  const renderList = (key: "features" | "qaChecklist", title: string) => (
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

  return (
    <div className="space-y-6">
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

      {renderList("features", "Features")}

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

      {renderList("qaChecklist", "QA Checklist")}
    </div>
  );
}
