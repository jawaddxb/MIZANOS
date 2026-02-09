"use client";

import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { SelectField } from "@/components/molecules/forms/SelectField";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { useProducts } from "@/hooks/queries/useProducts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import { toast } from "sonner";

interface AssignToProjectDialogProps {
  profileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MEMBER_ROLES = [
  "engineer",
  "pm",
  "designer",
  "qa",
  "tech_lead",
  "marketing_lead",
] as const;

function AssignToProjectDialog({
  profileId,
  open,
  onOpenChange,
}: AssignToProjectDialogProps) {
  const { data: products = [], isLoading } = useProducts();
  const queryClient = useQueryClient();
  const addMember = useMutation({
    mutationFn: (data: { productId: string; profile_id: string; role: string }) =>
      productsRepository.addMember(data.productId, {
        profile_id: data.profile_id,
        role: data.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Member assigned to project");
    },
    onError: (error: Error) => {
      toast.error("Failed to assign: " + error.message);
    },
  });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [role, setRole] = useState("engineer");

  useEffect(() => {
    if (open) {
      setSelectedProduct("");
      setRole("engineer");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    addMember.mutate(
      { productId: selectedProduct, profile_id: profileId, role },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to Project</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <SelectField
              label="Product"
              id="assign-product"
              value={selectedProduct}
              onValueChange={setSelectedProduct}
              placeholder="Select a product..."
              options={products.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />

            <SelectField
              label="Role"
              id="assign-role"
              value={role}
              onValueChange={setRole}
              options={MEMBER_ROLES.map((r) => ({
                value: r,
                label: r.replace("_", " "),
              }))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedProduct || addMember.isPending}
              >
                Assign
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { AssignToProjectDialog };
export type { AssignToProjectDialogProps };
