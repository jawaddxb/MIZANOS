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
import { useUpdateProduct, useDeleteProduct } from "@/hooks/mutations/useProductMutations";
import { Trash2 } from "lucide-react";
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
  { value: "archived", label: "Archived" },
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
  const deleteProduct = useDeleteProduct();
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      setConfirmDelete(false);
    }
  }, [product, open, reset]);

  const handleDelete = () => {
    deleteProduct.mutate(productId, {
      onSuccess: () => {
        onOpenChange(false);
        router.push("/dashboard");
      },
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
            />
          </div>

          <SelectField
            label="Stage"
            placeholder="Select stage"
            options={STAGE_OPTIONS}
            value={currentStage ?? "active"}
            onValueChange={(v) => setValue("stage", v)}
          />

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
        </form>

        <div className="border-t pt-4 mt-2">
          <h3 className="text-sm font-medium text-destructive mb-2">Danger Zone</h3>
          {!confirmDelete ? (
            <BaseButton
              type="button"
              variant="outline"
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Product
            </BaseButton>
          ) : (
            <div className="flex items-center gap-2">
              <BaseButton
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? "Deleting..." : "Confirm Delete"}
              </BaseButton>
              <BaseButton
                type="button"
                variant="outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </BaseButton>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            This action cannot be undone.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
