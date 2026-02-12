"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { useRenameFolder } from "@/hooks/mutations/useDocumentFolderMutations";
import type { DocumentFolder } from "@/lib/types";

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: DocumentFolder | null;
  productId: string;
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  folder,
  productId,
}: RenameFolderDialogProps) {
  const [name, setName] = useState("");
  const renameFolder = useRenameFolder(productId);

  useEffect(() => {
    if (folder) setName(folder.name);
  }, [folder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folder) return;
    renameFolder.mutate(
      { folderId: folder.id, name },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Folder Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || renameFolder.isPending}
            >
              Rename
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
