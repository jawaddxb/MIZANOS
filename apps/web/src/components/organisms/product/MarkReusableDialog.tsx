"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/atoms/layout/Dialog";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { useUpdateSpecFeature } from "@/hooks/mutations/useSpecificationFeatureMutations";
import type { SpecificationFeature } from "@/lib/types";

interface MarkReusableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: SpecificationFeature | null;
  productId: string;
}

export function MarkReusableDialog({
  open,
  onOpenChange,
  feature,
  productId,
}: MarkReusableDialogProps) {
  const updateFeature = useUpdateSpecFeature(productId);

  const handleConfirm = () => {
    if (!feature) return;
    updateFeature.mutate(
      { id: feature.id, is_reusable: true },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Mark as Reusable</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to mark{" "}
          <span className="font-medium text-foreground">
            {feature?.name}
          </span>{" "}
          as reusable? It will be available in the feature library for other
          products to import.
        </p>

        <DialogFooter className="pt-2">
          <BaseButton
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </BaseButton>
          <BaseButton
            onClick={handleConfirm}
            disabled={updateFeature.isPending}
          >
            {updateFeature.isPending ? "Saving..." : "Mark as Reusable"}
          </BaseButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
