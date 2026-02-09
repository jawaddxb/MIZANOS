"use client";

import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { cn } from "@/lib/utils/cn";
import { Plus, Loader2, Layers } from "lucide-react";
import { useSpecificationFeatures } from "@/hooks/queries/useSpecificationFeatures";

export interface FeaturesTabProps {
  productId: string;
}

type FeatureStatus = "proposed" | "approved" | "queued" | "in_progress" | "done";
type FeaturePriority = "low" | "medium" | "high" | "critical";

interface Feature {
  id: string;
  name: string;
  description?: string;
  status: FeatureStatus;
  priority: FeaturePriority;
  github_path?: string;
}

const COLUMNS: { id: FeatureStatus; title: string; color: string }[] = [
  { id: "proposed", title: "Proposed", color: "border-muted-foreground/30" },
  { id: "approved", title: "Approved", color: "border-pillar-business/30" },
  { id: "queued", title: "Queued", color: "border-status-warning/30" },
  { id: "in_progress", title: "In Progress", color: "border-pillar-development/30" },
  { id: "done", title: "Done", color: "border-status-healthy/30" },
];

const PRIORITY_STYLES: Record<FeaturePriority, string> = {
  low: "bg-secondary text-muted-foreground",
  medium: "bg-status-warning/10 text-status-warning",
  high: "bg-status-warning/10 text-status-warning",
  critical: "bg-status-critical/10 text-status-critical",
};

export function FeaturesTab({ productId }: FeaturesTabProps) {
  const { data: specFeatures, isLoading } = useSpecificationFeatures(productId);

  const features: Feature[] = (specFeatures ?? []).map((sf) => ({
    id: sf.id,
    name: sf.name,
    description: sf.description ?? undefined,
    status: (sf.status as FeatureStatus) || "proposed",
    priority: (sf.priority as FeaturePriority) || "medium",
    github_path: sf.github_path ?? undefined,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Feature Board</h2>
          <p className="text-sm text-muted-foreground">Track features from proposal to completion</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Feature
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-3 min-h-[400px]">
        {COLUMNS.map((col) => {
          const colFeatures = features.filter((f) => f.status === col.id);
          return (
            <div key={col.id} className={cn("rounded-lg border-2 border-dashed p-3", col.color)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">{col.title}</h3>
                <Badge variant="secondary" className="text-xs">{colFeatures.length}</Badge>
              </div>
              <div className="space-y-2">
                {colFeatures.map((feature) => (
                  <FeatureCard key={feature.id} feature={feature} />
                ))}
                {colFeatures.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No features</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {features.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="font-medium">No features yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add features manually or generate them from the specification
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate">{feature.name}</p>
        {feature.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge className={cn("text-[10px]", PRIORITY_STYLES[feature.priority])}>
            {feature.priority}
          </Badge>
          {feature.github_path && (
            <span className="text-[10px] text-muted-foreground font-mono truncate">
              {feature.github_path}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
