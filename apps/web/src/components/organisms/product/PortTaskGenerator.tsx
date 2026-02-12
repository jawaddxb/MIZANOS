"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { useExtractManifest, useGeneratePortTasks } from "@/hooks/mutations/usePortGenerator";
import type { LovableManifest } from "@/lib/types";
import {
  Search, Loader2, CheckCircle2, Table2, Code2,
  Zap, Route, Component, GitFork,
} from "lucide-react";

interface PortTaskGeneratorProps {
  productId: string;
  sourceType?: string;
}

const STAT_ICONS = [
  { key: "total_tables", label: "Tables", icon: Table2 },
  { key: "total_queries", label: "Queries", icon: Code2 },
  { key: "total_edge_functions", label: "Edge Fns", icon: Zap },
  { key: "total_routes", label: "Routes", icon: Route },
  { key: "total_components", label: "Components", icon: Component },
  { key: "total_hooks", label: "Hooks", icon: GitFork },
] as const;

function PortTaskGenerator({ productId, sourceType }: PortTaskGeneratorProps) {
  const [sourcePath, setSourcePath] = useState("");
  const [manifest, setManifest] = useState<LovableManifest | null>(null);
  const [generated, setGenerated] = useState(false);

  const extract = useExtractManifest();
  const generate = useGeneratePortTasks(productId);

  if (sourceType !== "lovable_port") return null;

  const handleScan = () => {
    extract.mutate(sourcePath, {
      onSuccess: (data) => setManifest(data),
    });
  };

  const handleGenerate = () => {
    generate.mutate(sourcePath || undefined, {
      onSuccess: () => setGenerated(true),
    });
  };

  const step = generated ? 3 : manifest ? 2 : 1;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Port Task Generator
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Scan */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter the local path to a Lovable project to scan its structure.
            </p>
            <div className="flex gap-2">
              <BaseInput
                placeholder="/path/to/lovable-project"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleScan}
                loading={extract.isPending}
                disabled={!sourcePath.trim()}
                leftIcon={<Search className="h-4 w-4" />}
              >
                Scan
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && manifest && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {STAT_ICONS.map(({ key, label, icon: Icon }) => (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="ml-auto text-sm font-semibold tabular-nums">
                    {manifest.summary[key as keyof typeof manifest.summary]}
                  </span>
                </div>
              ))}
            </div>
            {manifest.domains.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Domains ({manifest.domains.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {manifest.domains.map((d) => (
                    <Badge key={d} variant="secondary" className="font-mono text-xs">
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setManifest(null); setGenerated(false); }}
              >
                Re-scan
              </Button>
              <Button
                size="sm"
                onClick={handleGenerate}
                loading={generate.isPending}
                leftIcon={<Zap className="h-4 w-4" />}
              >
                Generate {manifest.domains.length * 5 + 3} Tasks
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="flex items-center gap-3 py-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="text-sm text-foreground">
              Tasks generated. Switch to the <strong>Tasks</strong> tab to view them.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { PortTaskGenerator };
export type { PortTaskGeneratorProps };
