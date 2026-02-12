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
import { Button } from "@/components/molecules/buttons/Button";
import { settingsRepository } from "@/lib/api/repositories";
import type { Module } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null;
}

interface ModuleFormState {
  name: string;
  description: string;
  category: string;
  docs_url: string;
  scaffolding_url: string;
}

export function EditModuleDialog({ open, onOpenChange, module }: EditModuleDialogProps) {
  const [form, setForm] = useState<ModuleFormState>({
    name: "",
    description: "",
    category: "",
    docs_url: "",
    scaffolding_url: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (module) {
      setForm({
        name: module.name,
        description: module.description ?? "",
        category: module.category ?? "",
        docs_url: module.docs_url ?? "",
        scaffolding_url: module.scaffolding_url ?? "",
      });
    }
  }, [module]);

  const updateModule = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Module> }) =>
      settingsRepository.updateModule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "modules"] });
      toast.success("Module updated");
    },
    onError: () => toast.error("Failed to update module"),
  });

  const handleSubmit = useCallback(() => {
    if (!module || !form.name) return;
    updateModule.mutate(
      {
        id: module.id,
        data: {
          name: form.name,
          description: form.description || null,
          category: form.category || "",
          docs_url: form.docs_url || null,
          scaffolding_url: form.scaffolding_url || null,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }, [module, form, updateModule, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Module</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <BaseLabel htmlFor="edit-module-name">Name *</BaseLabel>
            <BaseInput
              id="edit-module-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="edit-module-category">Category</BaseLabel>
            <BaseInput
              id="edit-module-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="edit-module-desc">Description</BaseLabel>
            <BaseInput
              id="edit-module-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="edit-module-docs">Docs URL</BaseLabel>
            <BaseInput
              id="edit-module-docs"
              value={form.docs_url}
              onChange={(e) => setForm({ ...form, docs_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="edit-module-scaffold">Scaffolding URL</BaseLabel>
            <BaseInput
              id="edit-module-scaffold"
              value={form.scaffolding_url}
              onChange={(e) => setForm({ ...form, scaffolding_url: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name || updateModule.isPending}>
            {updateModule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
