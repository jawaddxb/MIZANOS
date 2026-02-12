"use client";

import { useState } from "react";

import { Plus, Trash2, Pencil, ExternalLink, Plug } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { SelectField } from "@/components/molecules/forms/SelectField";
import { useProjectIntegrations } from "@/hooks/queries/useProjectIntegrations";
import { useIntegrationMutations } from "@/hooks/mutations/useProjectIntegrationMutations";
import { EditProjectIntegrationDialog } from "./EditProjectIntegrationDialog";
import type { ProjectIntegration } from "@/lib/types";

interface ProjectIntegrationsProps {
  productId: string;
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  error: "destructive",
};

const INTEGRATION_CATEGORIES = [
  "ci_cd",
  "monitoring",
  "analytics",
  "communication",
  "storage",
  "other",
] as const;

function ProjectIntegrations({ productId }: ProjectIntegrationsProps) {
  const { data: integrations = [], isLoading } =
    useProjectIntegrations(productId);
  const { addIntegration, deleteIntegration } =
    useIntegrationMutations(productId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<ProjectIntegration | null>(null);

  const handleAdd = (data: Partial<ProjectIntegration>) => {
    addIntegration.mutate(
      {
        product_id: productId,
        name: data.name ?? "",
        type: data.type ?? "custom",
        category: data.category ?? "other",
        status: "active",
        description: data.description ?? null,
        endpoint_url: data.endpoint_url ?? null,
        docs_url: data.docs_url ?? null,
        notes: data.notes ?? null,
        api_key_configured: false,
        global_integration_id: null,
      },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Project Integrations ({integrations.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No integrations configured for this project.
            </p>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onDelete={() => deleteIntegration.mutate(integration.id)}
                  onEdit={() => { setSelectedIntegration(integration); setEditDialogOpen(true); }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddIntegrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAdd}
        isSubmitting={addIntegration.isPending}
      />

      <EditProjectIntegrationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        integration={selectedIntegration}
        productId={productId}
      />
    </>
  );
}

function IntegrationCard({
  integration,
  onDelete,
  onEdit,
}: {
  integration: ProjectIntegration;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border p-3">
      <div className="space-y-1 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{integration.name}</span>
          <Badge
            variant={STATUS_VARIANTS[integration.status] ?? "outline"}
            className="text-xs"
          >
            {integration.status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {integration.category}
          </Badge>
        </div>
        {integration.description && (
          <p className="text-xs text-muted-foreground">
            {integration.description}
          </p>
        )}
        {integration.endpoint_url && (
          <a
            href={integration.endpoint_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {integration.endpoint_url}
          </a>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function AddIntegrationDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<ProjectIntegration>) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("custom");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, type, category, description, endpoint_url: endpointUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Integration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <BaseLabel htmlFor="int-name">Name</BaseLabel>
            <BaseInput
              id="int-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Integration name"
            />
          </div>
          <SelectField
            label="Category"
            id="int-category"
            value={category}
            onValueChange={setCategory}
            options={INTEGRATION_CATEGORIES.map((c) => ({
              value: c,
              label: c.replace("_", " "),
            }))}
          />
          <div>
            <BaseLabel htmlFor="int-desc">Description</BaseLabel>
            <BaseTextarea
              id="int-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              rows={2}
            />
          </div>
          <div>
            <BaseLabel htmlFor="int-url">Endpoint URL</BaseLabel>
            <BaseInput
              id="int-url"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name || isSubmitting}>
              Add Integration
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ProjectIntegrations };
export type { ProjectIntegrationsProps };
