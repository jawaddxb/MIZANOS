"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/atoms/layout/Dialog";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { SelectField } from "@/components/molecules/forms/SelectField";
import { useUpdateSpecFeature } from "@/hooks/mutations/useSpecificationFeatureMutations";
import type { SpecificationFeature } from "@/lib/types";

const featureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["proposed", "approved", "queued", "in_progress", "done"]),
  github_path: z.string().optional(),
});

type FeatureFormValues = z.infer<typeof featureSchema>;

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_OPTIONS = [
  { value: "proposed", label: "Proposed" },
  { value: "approved", label: "Approved" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

interface EditFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: SpecificationFeature | null;
  productId: string;
}

export function EditFeatureDialog({
  open,
  onOpenChange,
  feature,
  productId,
}: EditFeatureDialogProps) {
  const updateFeature = useUpdateSpecFeature(productId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: "medium",
      status: "proposed",
      github_path: "",
    },
  });

  useEffect(() => {
    if (feature && open) {
      reset({
        name: feature.name,
        description: feature.description ?? "",
        priority: feature.priority as FeatureFormValues["priority"],
        status: feature.status as FeatureFormValues["status"],
        github_path: feature.github_path ?? "",
      });
    }
  }, [feature, open, reset]);

  const onFormSubmit = (values: FeatureFormValues) => {
    if (!feature) return;
    updateFeature.mutate(
      {
        id: feature.id,
        name: values.name,
        description: values.description ?? null,
        priority: values.priority,
        status: values.status,
        github_path: values.github_path || null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const currentPriority = watch("priority");
  const currentStatus = watch("status");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Feature</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="space-y-2">
            <BaseLabel htmlFor="edit-feature-name">Name</BaseLabel>
            <BaseInput
              id="edit-feature-name"
              placeholder="Feature name..."
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <BaseLabel htmlFor="edit-feature-description">Description</BaseLabel>
            <BaseTextarea
              id="edit-feature-description"
              placeholder="Optional description..."
              className="resize-none"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Priority"
              placeholder="Select priority"
              options={PRIORITY_OPTIONS}
              value={currentPriority}
              onValueChange={(v) =>
                setValue("priority", v as FeatureFormValues["priority"])
              }
            />
            <SelectField
              label="Status"
              placeholder="Select status"
              options={STATUS_OPTIONS}
              value={currentStatus}
              onValueChange={(v) =>
                setValue("status", v as FeatureFormValues["status"])
              }
            />
          </div>

          <div className="space-y-2">
            <BaseLabel htmlFor="edit-feature-github-path">GitHub Path</BaseLabel>
            <BaseInput
              id="edit-feature-github-path"
              placeholder="src/features/..."
              {...register("github_path")}
            />
          </div>

          <DialogFooter className="pt-2">
            <BaseButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </BaseButton>
            <BaseButton type="submit" disabled={updateFeature.isPending}>
              {updateFeature.isPending ? "Saving..." : "Save Changes"}
            </BaseButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
