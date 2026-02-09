"use client";

import * as React from "react";
import { GitBranch } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { PillarType, ProjectSourceType } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { TextField } from "@/components/molecules/forms/TextField";
import { SelectField } from "@/components/molecules/forms/SelectField";

import {
  PILLAR_OPTIONS,
  SOURCE_TYPE_OPTIONS,
} from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface IntakeBasicInfoProps {
  projectName: string;
  onProjectNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  pillar: PillarType | "";
  onPillarChange: (value: PillarType) => void;
  sourceType: ProjectSourceType;
  onSourceTypeChange: (value: ProjectSourceType) => void;
  errors?: Partial<Record<"projectName" | "pillar", string>>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function IntakeBasicInfo({
  projectName,
  onProjectNameChange,
  description,
  onDescriptionChange,
  pillar,
  onPillarChange,
  sourceType,
  onSourceTypeChange,
  errors,
}: IntakeBasicInfoProps) {
  const selectedSourceType = SOURCE_TYPE_OPTIONS.find(
    (opt) => opt.value === sourceType,
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Project Details</CardTitle>
        <CardDescription>Basic information about the project</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Row 1: Name + Pillar + Source Type */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            label="Project Name *"
            placeholder="e.g., E-commerce Platform"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            error={errors?.projectName}
          />

          <SelectField
            label="Pillar *"
            placeholder="Select pillar"
            options={PILLAR_OPTIONS}
            value={pillar || undefined}
            onValueChange={(v) => onPillarChange(v as PillarType)}
            error={errors?.pillar}
          />

          <SelectField
            label="Source Type"
            placeholder="Select source"
            options={SOURCE_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            value={sourceType}
            onValueChange={(v) => onSourceTypeChange(v as ProjectSourceType)}
          />
        </div>

        {/* Row 2: Description */}
        <TextField
          label="Description"
          placeholder="Brief description of the project..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />

        {/* Source type info banner */}
        {selectedSourceType && (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3">
            <GitBranch className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedSourceType.label}</p>
              <p className="text-xs text-muted-foreground">
                {selectedSourceType.description}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
