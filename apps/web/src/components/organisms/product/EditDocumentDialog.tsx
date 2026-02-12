"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { documentsRepository } from "@/lib/api/repositories";
import type { ProductDocument } from "@/lib/types";

const CATEGORY_OPTIONS = [
  { value: "design", label: "Design" },
  { value: "requirements", label: "Requirements" },
  { value: "screenshots", label: "Screenshots" },
  { value: "contracts", label: "Contracts" },
  { value: "reports", label: "Reports" },
  { value: "general", label: "General" },
];

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ProductDocument | null;
}

export function EditDocumentDialog({
  open,
  onOpenChange,
  document: doc,
}: EditDocumentDialogProps) {
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (doc && open) {
      setFileName(doc.file_name);
      setDescription(doc.description ?? "");
      setCategory(doc.category ?? "general");
    }
  }, [doc, open]);

  const updateDocument = useMutation({
    mutationFn: () => {
      if (!doc) throw new Error("No document selected");
      return documentsRepository.update(doc.id, {
        file_name: fileName,
        description: description || null,
        category,
      });
    },
    onSuccess: () => {
      if (doc) {
        queryClient.invalidateQueries({
          queryKey: ["documents", doc.product_id],
        });
      }
      toast.success("Document updated");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update document: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDocument.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <BaseLabel htmlFor="doc-file-name">File Name</BaseLabel>
            <BaseInput
              id="doc-file-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <BaseLabel htmlFor="doc-description">Description</BaseLabel>
            <BaseTextarea
              id="doc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="resize-none"
              rows={3}
            />
          </div>

          <SelectField
            label="Category"
            placeholder="Select category"
            options={CATEGORY_OPTIONS}
            value={category}
            onValueChange={setCategory}
          />

          <DialogFooter className="pt-2">
            <BaseButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </BaseButton>
            <BaseButton
              type="submit"
              disabled={!fileName.trim() || updateDocument.isPending}
            >
              {updateDocument.isPending ? "Saving..." : "Save Changes"}
            </BaseButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
