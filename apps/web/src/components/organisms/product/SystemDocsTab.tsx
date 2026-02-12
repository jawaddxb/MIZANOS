"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import {
  useSystemDocuments,
  useGenerateSystemDocs,
  useRegenerateSystemDocs,
} from "@/hooks/queries/useSystemDocuments";
import type { SystemDocument, SystemDocType } from "@/lib/types";
import {
  FileText, Code2, Rocket, RefreshCw, Sparkles,
  Clock, ChevronRight,
} from "lucide-react";

interface SystemDocsTabProps {
  productId: string;
}

const DOC_TYPE_CONFIG: Record<
  SystemDocType,
  { label: string; icon: typeof FileText; description: string }
> = {
  functional_spec: {
    label: "Functional Spec",
    icon: FileText,
    description: "Features, user flows, data models, and business rules",
  },
  implementation_spec: {
    label: "Implementation Spec",
    icon: Code2,
    description: "Architecture, tech stack, patterns, and dependencies",
  },
  deployment_docs: {
    label: "Deployment Docs",
    icon: Rocket,
    description: "Setup guide, environment config, and CI/CD pipeline",
  },
};

function SystemDocsTab({ productId }: SystemDocsTabProps) {
  const { data: docs, isLoading } = useSystemDocuments(productId);
  const generateDocs = useGenerateSystemDocs(productId);
  const regenerateDocs = useRegenerateSystemDocs(productId);
  const [selectedType, setSelectedType] = useState<SystemDocType | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const latestByType = (docs ?? []).reduce<Record<string, SystemDocument>>(
    (acc, doc) => {
      const existing = acc[doc.doc_type];
      if (!existing || doc.version > existing.version) {
        acc[doc.doc_type] = doc;
      }
      return acc;
    },
    {},
  );

  const hasDocs = Object.keys(latestByType).length > 0;
  const selectedDoc = selectedType ? latestByType[selectedType] : null;

  if (!hasDocs) {
    return (
      <EmptyState
        onGenerate={() => generateDocs.mutate(undefined)}
        loading={generateDocs.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          System Documents
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => regenerateDocs.mutate()}
          loading={regenerateDocs.isPending}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Regenerate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.entries(DOC_TYPE_CONFIG) as [SystemDocType, typeof DOC_TYPE_CONFIG[SystemDocType]][]).map(
          ([type, config]) => {
            const doc = latestByType[type];
            const Icon = config.icon;
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(isSelected ? null : type)}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  {doc && (
                    <Badge variant="secondary" className="text-[10px] tabular-nums">
                      v{doc.version}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {config.description}
                </p>
                {doc && (
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                    <Clock className="h-3 w-3" />
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </p>
                )}
                {!doc && (
                  <p className="text-[10px] text-muted-foreground/60 mt-2 italic">
                    Not generated
                  </p>
                )}
              </button>
            );
          },
        )}
      </div>

      {selectedDoc && <DocViewer doc={selectedDoc} />}
    </div>
  );
}

function EmptyState({
  onGenerate,
  loading,
}: {
  onGenerate: () => void;
  loading: boolean;
}) {
  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardContent className="py-12 text-center">
        <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium mb-1">No System Documents Yet</p>
        <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
          Generate AI-powered living documentation: functional spec, implementation spec, and deployment docs.
        </p>
        <Button
          onClick={onGenerate}
          loading={loading}
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          Generate Documents
        </Button>
      </CardContent>
    </Card>
  );
}

function DocViewer({ doc }: { doc: SystemDocument }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {DOC_TYPE_CONFIG[doc.doc_type as SystemDocType]?.label ?? doc.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs tabular-nums">
            Version {doc.version}
          </Badge>
        </div>
        {doc.source_metadata && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <ChevronRight className="h-3 w-3" />
            Source: {doc.generation_source}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
          {doc.content || "No content available."}
        </div>
      </CardContent>
    </Card>
  );
}

export { SystemDocsTab };
export type { SystemDocsTabProps };
