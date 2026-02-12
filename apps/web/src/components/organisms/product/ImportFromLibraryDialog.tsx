"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { Badge } from "@/components/atoms/display/Badge";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Loader2, Download, Layers } from "lucide-react";
import { useReusableFeaturesForImport } from "@/hooks/queries/useReusableFeatures";
import { useCreateSpecFeature } from "@/hooks/mutations/useSpecificationFeatureMutations";
import type { FeaturePriority } from "@/lib/types";
import type { ReusableFeatureWithProduct } from "@/hooks/queries/useReusableFeatures";

interface ImportFromLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}

export function ImportFromLibraryDialog({
  open,
  onOpenChange,
  productId,
}: ImportFromLibraryDialogProps) {
  const { data: features = [], isLoading } =
    useReusableFeaturesForImport(open ? productId : undefined);
  const createFeature = useCreateSpecFeature(productId);

  const handleImport = (feature: ReusableFeatureWithProduct) => {
    createFeature.mutate({
      name: feature.name,
      description: feature.description ?? undefined,
      priority: (feature.priority as FeaturePriority) || "medium",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from Feature Library</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && features.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Layers className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="font-medium">No reusable features available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Mark features as reusable from other products to see them here
            </p>
          </div>
        )}

        {!isLoading && features.length > 0 && (
          <div className="space-y-3">
            {features.map((feature) => (
              <Card key={feature.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {feature.name}
                    </p>
                    {feature.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {feature.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {feature.priority}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        from {feature.product_name}
                      </span>
                    </div>
                  </div>
                  <BaseButton
                    size="sm"
                    variant="outline"
                    className="ml-3 shrink-0"
                    onClick={() => handleImport(feature)}
                    disabled={createFeature.isPending}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Import
                  </BaseButton>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
