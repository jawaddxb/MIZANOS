"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { Button } from "@/components/molecules/buttons/Button";
import { settingsRepository } from "@/lib/api/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ModuleFormState {
  name: string;
  description: string;
  category: string;
  docs_url: string;
  scaffolding_url: string;
}

const INITIAL_STATE: ModuleFormState = {
  name: "",
  description: "",
  category: "",
  docs_url: "",
  scaffolding_url: "",
};

export function CreateModuleDialog({ open, onOpenChange }: CreateModuleDialogProps) {
  const [form, setForm] = useState<ModuleFormState>(INITIAL_STATE);
  const queryClient = useQueryClient();

  const createModule = useMutation({
    mutationFn: (data: Partial<{ name: string; description: string; category: string; docs_url: string; scaffolding_url: string }>) =>
      settingsRepository.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "modules"] });
      toast.success("Module created");
    },
    onError: () => toast.error("Failed to create module"),
  });

  const handleClose = useCallback(
    (v: boolean) => {
      if (!v) setForm(INITIAL_STATE);
      onOpenChange(v);
    },
    [onOpenChange],
  );

  const handleSubmit = useCallback(() => {
    if (!form.name) return;
    createModule.mutate(
      {
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        docs_url: form.docs_url || undefined,
        scaffolding_url: form.scaffolding_url || undefined,
      },
      { onSuccess: () => handleClose(false) },
    );
  }, [form, createModule, handleClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Module</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <BaseLabel htmlFor="module-name">Name *</BaseLabel>
            <BaseInput
              id="module-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Module name"
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="module-category">Category</BaseLabel>
            <BaseInput
              id="module-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g., Frontend, Backend"
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="module-desc">Description</BaseLabel>
            <BaseInput
              id="module-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does this module do?"
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="module-docs">Docs URL</BaseLabel>
            <BaseInput
              id="module-docs"
              value={form.docs_url}
              onChange={(e) => setForm({ ...form, docs_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="module-scaffold">Scaffolding URL</BaseLabel>
            <BaseInput
              id="module-scaffold"
              value={form.scaffolding_url}
              onChange={(e) => setForm({ ...form, scaffolding_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name || createModule.isPending}>
            {createModule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Module
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
