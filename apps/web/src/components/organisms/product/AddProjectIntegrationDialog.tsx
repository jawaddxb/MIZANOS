"use client";

import { useState, useEffect } from "react";
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
import { useIntegrationMutations } from "@/hooks/mutations/useProjectIntegrationMutations";

const CATEGORY_OPTIONS = [
  { value: "ci_cd", label: "CI/CD" },
  { value: "monitoring", label: "Monitoring" },
  { value: "analytics", label: "Analytics" },
  { value: "communication", label: "Communication" },
  { value: "storage", label: "Storage" },
  { value: "other", label: "Other" },
];

const TYPE_OPTIONS = [
  { value: "github", label: "GitHub" },
  { value: "vercel", label: "Vercel" },
  { value: "railway", label: "Railway" },
  { value: "sentry", label: "Sentry" },
  { value: "slack", label: "Slack" },
  { value: "custom", label: "Custom" },
];

interface AddProjectIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}

export function AddProjectIntegrationDialog({
  open,
  onOpenChange,
  productId,
}: AddProjectIntegrationDialogProps) {
  const { addIntegration } = useIntegrationMutations(productId);
  const [name, setName] = useState("");
  const [type, setType] = useState("custom");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setType("custom");
      setCategory("other");
      setDescription("");
      setEndpointUrl("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIntegration.mutate(
      {
        product_id: productId,
        name,
        type,
        category,
        status: "active",
        description: description || null,
        endpoint_url: endpointUrl || null,
        docs_url: null,
        notes: null,
        api_key_configured: false,
        global_integration_id: null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Integration</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <BaseLabel htmlFor="add-int-name">Name</BaseLabel>
            <BaseInput
              id="add-int-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Integration name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Type"
              placeholder="Select type"
              options={TYPE_OPTIONS}
              value={type}
              onValueChange={setType}
            />
            <SelectField
              label="Category"
              placeholder="Select category"
              options={CATEGORY_OPTIONS}
              value={category}
              onValueChange={setCategory}
            />
          </div>

          <div className="space-y-2">
            <BaseLabel htmlFor="add-int-desc">Description</BaseLabel>
            <BaseTextarea
              id="add-int-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <BaseLabel htmlFor="add-int-url">Endpoint URL</BaseLabel>
            <BaseInput
              id="add-int-url"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://..."
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
              disabled={!name.trim() || addIntegration.isPending}
            >
              {addIntegration.isPending ? "Adding..." : "Add Integration"}
            </BaseButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
