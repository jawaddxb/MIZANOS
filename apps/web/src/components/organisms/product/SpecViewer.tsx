"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";
import { Button } from "@/components/molecules/buttons/Button";
import { CardHeader, CardTitle } from "@/components/atoms/display/Card";
import {
  useSpecifications,
} from "@/hooks/queries/useSpecifications";
import { useRegenerateSpecification } from "@/hooks/mutations/useSpecificationMutations";
import type { Specification } from "@/lib/types";
import { History, FileText, RefreshCw, Loader2, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { parseSpecContent, SpecContentSections } from "./SpecContentSections";
import { CustomInstructionsBadge } from "@/components/molecules/specifications/CustomInstructionsBadge";

interface SpecViewerProps {
  productId: string;
  productName: string;
  onNavigateToFeatures?: () => void;
}

function VersionSidebar({
  specifications,
  selectedVersion,
  latestVersion,
  onSelect,
}: {
  specifications: Specification[];
  selectedVersion: number | null;
  latestVersion: number | undefined;
  onSelect: (version: number) => void;
}) {
  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div className="px-4 pb-4 space-y-1">
            {specifications.map((spec) => (
              <button
                key={spec.id}
                onClick={() => onSelect(spec.version)}
                className={cn(
                  "w-full text-left p-2 rounded-md transition-colors",
                  selectedVersion === spec.version ||
                    (!selectedVersion && spec.version === latestVersion)
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-secondary",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">v{spec.version}</span>
                  {spec.version === latestVersion && (
                    <Badge variant="secondary" className="text-xs">
                      Latest
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(spec.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function SpecViewer({ productId, productName, onNavigateToFeatures }: SpecViewerProps) {
  const { data: specifications, isLoading } = useSpecifications(productId);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const regenerate = useRegenerateSpecification(productId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const latestSpec = specifications?.[0] ?? null;
  const currentSpec = selectedVersion
    ? specifications?.find((s) => s.version === selectedVersion) ?? latestSpec
    : latestSpec;

  if (!currentSpec) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Specification Generated
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Generate an AI-powered specification document based on your project
            details and any intake materials.
          </p>
          <Button
            onClick={() => regenerate.mutate(undefined)}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Specification
          </Button>
        </CardContent>
      </Card>
    );
  }

  const content = parseSpecContent(currentSpec.content);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {productName} Specification
            </h2>
            <p className="text-sm text-muted-foreground">
              Version {currentSpec.version} &bull; Generated{" "}
              {new Date(currentSpec.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToFeatures && (
              <Button variant="outline" size="sm" onClick={onNavigateToFeatures}>
                <Layers className="h-4 w-4 mr-1" />
                View Features
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => regenerate.mutate(undefined)}
              disabled={regenerate.isPending}
            >
              {regenerate.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Regenerate
            </Button>
          </div>
        </div>

        {currentSpec.custom_instructions && (
          <CustomInstructionsBadge
            instructions={currentSpec.custom_instructions}
            version={currentSpec.version}
          />
        )}

        <SpecContentSections content={content} />
      </div>

      <div className="lg:col-span-1">
        <VersionSidebar
          specifications={specifications ?? []}
          selectedVersion={selectedVersion}
          latestVersion={latestSpec?.version}
          onSelect={setSelectedVersion}
        />
      </div>
    </div>
  );
}

export { SpecViewer };
export type { SpecViewerProps };
