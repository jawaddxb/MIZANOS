"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/molecules/buttons/Button";
import { Upload, FileText, Link, Mic, X } from "lucide-react";

type SourceType = "document" | "url" | "transcription" | "notes";

interface Source {
  id: string;
  type: SourceType;
  name: string;
  content?: string;
}

interface IntakeSourcesProps {
  sources: Source[];
  onAddSource: (type: SourceType) => void;
  onRemoveSource: (id: string) => void;
}

const sourceConfig: Record<SourceType, { icon: React.ReactNode; label: string; color: string }> = {
  document: { icon: <Upload className="h-4 w-4" />, label: "Upload Document", color: "text-pillar-development" },
  url: { icon: <Link className="h-4 w-4" />, label: "Add URL", color: "text-pillar-product" },
  transcription: { icon: <Mic className="h-4 w-4" />, label: "Transcription", color: "text-pillar-marketing" },
  notes: { icon: <FileText className="h-4 w-4" />, label: "Add Notes", color: "text-pillar-business" },
};

export function IntakeSources({ sources, onAddSource, onRemoveSource }: IntakeSourcesProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(sourceConfig) as [SourceType, typeof sourceConfig[SourceType]][]).map(
          ([type, config]) => (
            <Button
              key={type}
              variant="outline"
              className="flex items-center gap-2 justify-start h-auto py-3"
              onClick={() => onAddSource(type)}
            >
              <span className={config.color}>{config.icon}</span>
              <span className="text-sm">{config.label}</span>
            </Button>
          ),
        )}
      </div>

      {sources.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Added Sources</h4>
          {sources.map((source) => {
            const config = sourceConfig[source.type];
            return (
              <div key={source.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <span className={config.color}>{config.icon}</span>
                <span className="text-sm flex-1 truncate">{source.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => onRemoveSource(source.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
