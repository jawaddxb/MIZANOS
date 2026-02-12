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
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { documentsRepository } from "@/lib/api/repositories";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  parentId: string | null;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  productId,
  parentId,
}: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const createFolder = useMutation({
    mutationFn: () =>
      documentsRepository.createFolder({
        product_id: productId,
        name,
        parent_id: parentId ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document-folders", productId],
      });
      toast.success("Folder created");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to create folder: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFolder.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <BaseLabel htmlFor="folder-name">Folder Name</BaseLabel>
            <BaseInput
              id="folder-name"
              placeholder="Enter folder name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
            <BaseButton
              type="submit"
              disabled={!name.trim() || createFolder.isPending}
            >
              {createFolder.isPending ? "Creating..." : "Create Folder"}
            </BaseButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
