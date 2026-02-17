"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  useUpdateProduct,
  useArchiveProduct,
  useUnarchiveProduct,
} from "@/hooks/mutations/useProductMutations";
import { Archive, ArchiveRestore } from "lucide-react";
import type { Product } from "@/lib/types";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  stage: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const STAGE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

interface ProductSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  productId: string;
}

export function ProductSettingsDialog({
  open,
  onOpenChange,
  product,
  productId,
}: ProductSettingsDialogProps) {
  const router = useRouter();
  const updateProduct = useUpdateProduct();
  const archiveProduct = useArchiveProduct();
  const unarchiveProduct = useUnarchiveProduct();
  const [confirmAction, setConfirmAction] = useState(false);

  const isArchived = !!product.archived_at;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      description: "",
      stage: "active",
    },
  });

  useEffect(() => {
    if (product && open) {
      reset({
        name: product.name,
        description: "",
        stage: product.stage ?? product.status ?? "active",
      });
      setConfirmAction(false);
    }
  }, [product, open, reset]);

  const handleArchive = () => {
    archiveProduct.mutate(productId, {
      onSuccess: () => {
        onOpenChange(false);
        router.push("/products");
      },
    });
  };

  const handleUnarchive = () => {
    unarchiveProduct.mutate(productId, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const onFormSubmit = (values: SettingsFormValues) => {
    updateProduct.mutate(
      {
        id: productId,
        name: values.name,
        stage: values.stage || null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const currentStage = watch("stage");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Product Settings</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="space-y-2">
            <BaseLabel htmlFor="product-name">Name</BaseLabel>
            <BaseInput
              id="product-name"
              placeholder="Product name..."
              {...register("name")}
              aria-invalid={!!errors.name}
              disabled={isArchived}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <BaseLabel htmlFor="product-description">Description</BaseLabel>
            <BaseTextarea
              id="product-description"
              placeholder="Optional description..."
              className="resize-none"
              {...register("description")}
              rows={3}
              disabled={isArchived}
            />
          </div>

          <SelectField
            label="Stage"
            placeholder="Select stage"
            options={STAGE_OPTIONS}
            value={currentStage ?? "active"}
            onValueChange={(v) => setValue("stage", v)}
            disabled={isArchived}
          />

          {!isArchived && (
            <DialogFooter className="pt-2">
              <BaseButton
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </BaseButton>
              <BaseButton type="submit" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? "Saving..." : "Save Settings"}
              </BaseButton>
            </DialogFooter>
          )}
        </form>

        <div className="border-t pt-4 mt-2">
          {isArchived ? (
            <>
              <h3 className="text-sm font-medium text-emerald-700 mb-2">
                This product is archived
              </h3>
              {!confirmAction ? (
                <BaseButton
                  type="button"
                  variant="outline"
                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  onClick={() => setConfirmAction(true)}
                >
                  <ArchiveRestore className="h-4 w-4 mr-1" />
                  Restore Product
                </BaseButton>
              ) : (
                <div className="flex items-center gap-2">
                  <BaseButton
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleUnarchive}
                    disabled={unarchiveProduct.isPending}
                  >
                    {unarchiveProduct.isPending
                      ? "Restoring..."
                      : "Confirm Restore"}
                  </BaseButton>
                  <BaseButton
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmAction(false)}
                  >
                    Cancel
                  </BaseButton>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Restoring will make this product visible in the main list again.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium text-amber-700 mb-2">
                Archive
              </h3>
              {!confirmAction ? (
                <BaseButton
                  type="button"
                  variant="outline"
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={() => setConfirmAction(true)}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive Product
                </BaseButton>
              ) : (
                <div className="flex items-center gap-2">
                  <BaseButton
                    type="button"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleArchive}
                    disabled={archiveProduct.isPending}
                  >
                    {archiveProduct.isPending
                      ? "Archiving..."
                      : "Confirm Archive"}
                  </BaseButton>
                  <BaseButton
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmAction(false)}
                  >
                    Cancel
                  </BaseButton>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                This will hide the product from the main list. You can restore
                it later.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
