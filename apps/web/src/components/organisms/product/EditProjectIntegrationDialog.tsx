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
import type { ProjectIntegration } from "@/lib/types";

const CATEGORY_OPTIONS = [
  { value: "ci_cd", label: "CI/CD" },
  { value: "monitoring", label: "Monitoring" },
  { value: "analytics", label: "Analytics" },
  { value: "communication", label: "Communication" },
  { value: "storage", label: "Storage" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "error", label: "Error" },
];

interface EditProjectIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: ProjectIntegration | null;
  productId: string;
}

export function EditProjectIntegrationDialog({
  open,
  onOpenChange,
  integration,
  productId,
}: EditProjectIntegrationDialogProps) {
  const { updateIntegration } = useIntegrationMutations(productId);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");

  useEffect(() => {
    if (integration && open) {
      setName(integration.name);
      setCategory(integration.category);
      setStatus(integration.status);
      setDescription(integration.description ?? "");
      setEndpointUrl(integration.endpoint_url ?? "");
    }
  }, [integration, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!integration) return;
    updateIntegration.mutate(
      {
        id: integration.id,
        name,
        category,
        status,
        description: description || null,
        endpoint_url: endpointUrl || null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Integration</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <BaseLabel htmlFor="edit-int-name">Name</BaseLabel>
            <BaseInput
              id="edit-int-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Category"
              placeholder="Select category"
              options={CATEGORY_OPTIONS}
              value={category}
              onValueChange={setCategory}
            />
            <SelectField
              label="Status"
              placeholder="Select status"
              options={STATUS_OPTIONS}
              value={status}
              onValueChange={setStatus}
            />
          </div>

          <div className="space-y-2">
            <BaseLabel htmlFor="edit-int-desc">Description</BaseLabel>
            <BaseTextarea
              id="edit-int-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <BaseLabel htmlFor="edit-int-url">Endpoint URL</BaseLabel>
            <BaseInput
              id="edit-int-url"
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
              disabled={!name.trim() || updateIntegration.isPending}
            >
              {updateIntegration.isPending ? "Saving..." : "Save Changes"}
            </BaseButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
