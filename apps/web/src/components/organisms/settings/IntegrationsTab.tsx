"use client";

import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { settingsRepository } from "@/lib/api/repositories";
import type { Integration } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Key,
  ExternalLink,
  Trash2,
  Shield,
  CreditCard,
  BarChart3,
  Bot,
  Database,
  MessageSquare,
  Puzzle,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/atoms/layout/Dialog";
import { toast } from "sonner";

interface IntegrationsTabProps {
  className?: string;
  isAdmin?: boolean;
  onAddIntegration?: () => void;
}

type CategoryKey = "auth" | "payment" | "analytics" | "ai" | "storage" | "messaging" | "other";

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
  auth: <Shield className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  ai: <Bot className="h-4 w-4" />,
  storage: <Database className="h-4 w-4" />,
  messaging: <MessageSquare className="h-4 w-4" />,
  other: <Puzzle className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  auth: "Authentication",
  payment: "Payment",
  analytics: "Analytics",
  ai: "AI / ML",
  storage: "Storage",
  messaging: "Messaging",
  other: "Other",
};

function useIntegrations() {
  return useQuery({
    queryKey: ["settings", "integrations"],
    queryFn: () => settingsRepository.getIntegrations(),
  });
}

function useIntegrationMutations() {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Integration> }) =>
      settingsRepository.updateIntegration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "integrations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsRepository.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "integrations"] });
      toast.success("Integration deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete integration: " + error.message);
    },
  });

  return { update, deleteMutation };
}

function IntegrationCard({
  integration,
  isAdmin,
  onToggle,
  onDelete,
}: {
  integration: Integration;
  isAdmin: boolean;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const categoryKey = (integration.category || "other") as CategoryKey;

  return (
    <Card className={!integration.is_active ? "opacity-60" : ""}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-muted">
              {CATEGORY_ICONS[categoryKey] ?? CATEGORY_ICONS.other}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{integration.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {integration.type.toUpperCase()}
                </Badge>
              </div>
              {integration.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {integration.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                {integration.api_key && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Key className="h-3 w-3" />
                    API Key configured
                  </span>
                )}
                {integration.docs_url && (
                  <a
                    href={integration.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Docs
                  </a>
                )}
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(integration.id, !integration.is_active)}
              >
                {integration.is_active ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(integration.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function IntegrationsTab({
  className,
  isAdmin = false,
  onAddIntegration,
}: IntegrationsTabProps) {
  const { data: integrations = [], isLoading } = useIntegrations();
  const { update, deleteMutation } = useIntegrationMutations();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleToggle = useCallback(
    (id: string, isActive: boolean) => {
      update.mutate({ id, data: { is_active: isActive } });
    },
    [update],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setDeleteTarget(id);
    },
    [],
  );

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteMutation]);

  const grouped = useMemo(() => {
    return integrations.reduce<Record<string, Integration[]>>(
      (acc, integration) => {
        const category = integration.category || "other";
        if (!acc[category]) acc[category] = [];
        acc[category].push(integration);
        return acc;
      },
      {},
    );
  }, [integrations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Global Integrations</h3>
              <p className="text-sm text-muted-foreground">
                Configure company-wide API keys and services available across
                all projects
              </p>
            </div>
            {isAdmin && onAddIntegration && (
              <Button onClick={onAddIntegration}>Add Integration</Button>
            )}
          </div>
        </div>
        <div className="px-6 pb-6">
          {integrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No global integrations configured yet.</p>
              {isAdmin && (
                <p className="text-sm mt-1">
                  Add your first integration to make it available across all
                  projects.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, items]) => {
                const catKey = category as CategoryKey;
                return (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      {CATEGORY_ICONS[catKey] ?? CATEGORY_ICONS.other}
                      {CATEGORY_LABELS[catKey] ?? category}
                    </h4>
                    <div className="space-y-3">
                      {items.map((integration) => (
                        <IntegrationCard
                          key={integration.id}
                          integration={integration}
                          isAdmin={isAdmin}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Integration</DialogTitle>
            <DialogDescription>Are you sure you want to delete this integration? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
