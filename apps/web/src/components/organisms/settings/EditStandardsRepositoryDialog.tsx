"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import { Button } from "@/components/molecules/buttons/Button";
import type { StandardsRepository } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface EditStandardsRepositoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repository: StandardsRepository | null;
  onSave?: (id: string, data: Partial<StandardsRepository>) => void;
  isPending?: boolean;
}

interface FormState {
  name: string;
  url: string;
  description: string;
  is_active: boolean;
}

export function EditStandardsRepositoryDialog({
  open,
  onOpenChange,
  repository,
  onSave,
  isPending = false,
}: EditStandardsRepositoryDialogProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    url: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (repository) {
      setForm({
        name: repository.name,
        url: repository.url,
        description: repository.description ?? "",
        is_active: repository.is_active,
      });
    }
  }, [repository]);

  const handleSubmit = useCallback(() => {
    if (!repository || !form.name || !form.url || !onSave) return;
    onSave(repository.id, {
      name: form.name,
      url: form.url,
      description: form.description || null,
      is_active: form.is_active,
    });
    onOpenChange(false);
  }, [repository, form, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Standards Repository</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <BaseLabel htmlFor="edit-repo-name">Name *</BaseLabel>
            <BaseInput
              id="edit-repo-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="edit-repo-url">URL *</BaseLabel>
            <BaseInput
              id="edit-repo-url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="edit-repo-desc">Description</BaseLabel>
            <BaseTextarea
              id="edit-repo-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
          <div className="flex items-center gap-3">
            <BaseSwitch
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
            <BaseLabel>Active</BaseLabel>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.name || !form.url || isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
