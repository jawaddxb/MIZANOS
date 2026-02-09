"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";
import { Button } from "@/components/molecules/buttons/Button";
import {
  useSpecifications,
  useLatestSpecification,
} from "@/hooks/queries/useSpecifications";
import type { Specification, JsonValue } from "@/lib/types";
import {
  ChevronRight,
  Clock,
  AlertCircle,
  History,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SpecViewerProps {
  productId: string;
  productName: string;
}

interface SpecContent {
  overview?: string;
  technicalRequirements?: string[];
  features?: Array<{
    name: string;
    priority: string;
    description?: string;
  }>;
  timeline?: {
    estimatedDuration?: string;
    phases?: Array<{
      name: string;
      duration: string;
      deliverables?: string[];
    }>;
  };
  qaChecklist?: Array<{
    category: string;
    title: string;
  }>;
}

function parseSpecContent(content: JsonValue | undefined): SpecContent {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return {};
  }
  return content as unknown as SpecContent;
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

function SpecViewer({ productId, productName }: SpecViewerProps) {
  const { data: specifications, isLoading } = useSpecifications(productId);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

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
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Generate an AI-powered specification document based on your project
            details and any intake materials.
          </p>
        </CardContent>
      </Card>
    );
  }

  const content = parseSpecContent(currentSpec.content);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {productName} Specification
          </h2>
          <p className="text-sm text-muted-foreground">
            Version {currentSpec.version} &bull; Generated{" "}
            {new Date(currentSpec.created_at).toLocaleDateString()}
          </p>
        </div>

        {content.overview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {content.overview}
              </p>
            </CardContent>
          </Card>
        )}

        {content.technicalRequirements &&
          content.technicalRequirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Technical Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {content.technicalRequirements.map((req, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm"
                    >
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

        {content.timeline && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {content.timeline.estimatedDuration && (
                <p className="text-sm text-muted-foreground mb-4">
                  Estimated Duration:{" "}
                  <span className="font-medium text-foreground">
                    {content.timeline.estimatedDuration}
                  </span>
                </p>
              )}
              <div className="space-y-4">
                {content.timeline.phases?.map((phase, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      {index <
                        (content.timeline?.phases?.length ?? 0) - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">
                          {phase.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {phase.duration}
                        </Badge>
                      </div>
                      <ul className="space-y-1">
                        {phase.deliverables?.map((d, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground"
                          >
                            &bull; {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {content.qaChecklist && content.qaChecklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Suggested QA Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {content.qaChecklist.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm p-2 rounded-lg bg-secondary/30"
                  >
                    <Badge variant="outline" className="text-xs shrink-0">
                      {item.category}
                    </Badge>
                    <span className="text-muted-foreground">{item.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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
