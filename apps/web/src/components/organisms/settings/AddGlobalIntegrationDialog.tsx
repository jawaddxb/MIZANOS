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
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import { Button } from "@/components/molecules/buttons/Button";
import { SelectField } from "@/components/molecules/forms/SelectField";
import { settingsRepository } from "@/lib/api/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddGlobalIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface IntegrationFormState {
  name: string;
  type: string;
  category: string;
  description: string;
  config: string;
  is_active: boolean;
}

const INITIAL_STATE: IntegrationFormState = {
  name: "",
  type: "",
  category: "",
  description: "",
  config: "",
  is_active: true,
};

const TYPE_OPTIONS = [
  { value: "api", label: "API" },
  { value: "oauth", label: "OAuth" },
  { value: "webhook", label: "Webhook" },
  { value: "sdk", label: "SDK" },
];

const CATEGORY_OPTIONS = [
  { value: "auth", label: "Authentication" },
  { value: "payment", label: "Payment" },
  { value: "analytics", label: "Analytics" },
  { value: "ai", label: "AI / ML" },
  { value: "storage", label: "Storage" },
  { value: "messaging", label: "Messaging" },
  { value: "other", label: "Other" },
];

export function AddGlobalIntegrationDialog({
  open,
  onOpenChange,
}: AddGlobalIntegrationDialogProps) {
  const [form, setForm] = useState<IntegrationFormState>(INITIAL_STATE);
  const queryClient = useQueryClient();

  const createIntegration = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      settingsRepository.createIntegration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "integrations"] });
      toast.success("Integration created");
    },
    onError: () => toast.error("Failed to create integration"),
  });

  const handleClose = useCallback(
    (v: boolean) => {
      if (!v) setForm(INITIAL_STATE);
      onOpenChange(v);
    },
    [onOpenChange],
  );

  const handleSubmit = useCallback(() => {
    if (!form.name || !form.type) return;
    createIntegration.mutate(
      {
        name: form.name,
        type: form.type,
        category: form.category || "other",
        description: form.description || undefined,
        is_active: form.is_active,
      },
      { onSuccess: () => handleClose(false) },
    );
  }, [form, createIntegration, handleClose]);

  const isValid = form.name && form.type;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Global Integration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <BaseLabel htmlFor="integ-name">Name *</BaseLabel>
            <BaseInput
              id="integ-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Stripe, OpenAI"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Type *"
              options={TYPE_OPTIONS}
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
              placeholder="Select type"
            />
            <SelectField
              label="Category"
              options={CATEGORY_OPTIONS}
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
              placeholder="Select category"
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="integ-desc">Description</BaseLabel>
            <BaseInput
              id="integ-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does this integration do?"
            />
          </div>
          <div className="space-y-2">
            <BaseLabel>Config JSON (optional)</BaseLabel>
            <BaseTextarea
              value={form.config}
              onChange={(e) => setForm({ ...form, config: e.target.value })}
              placeholder='{"key": "value"}'
              className="font-mono text-sm min-h-[80px]"
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
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || createIntegration.isPending}>
            {createIntegration.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Add Integration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
