"use client";

import { useState } from "react";

import { Plus, Trash2, Pencil, Mail, ExternalLink } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { useStakeholders } from "@/hooks/queries/useStakeholders";
import { useStakeholderMutations } from "@/hooks/mutations/useStakeholderMutations";
import { STAKEHOLDER_ROLE_LABELS } from "@/lib/types";
import type { Stakeholder, StakeholderRole } from "@/lib/types";
import {
  StakeholderDialog,
  type StakeholderFormData,
} from "./StakeholderDialog";

interface StakeholdersListProps {
  productId: string;
}

function StakeholdersList({ productId }: StakeholdersListProps) {
  const { data: stakeholders = [], isLoading } = useStakeholders(productId);
  const { createStakeholder, updateStakeholder, deleteStakeholder } =
    useStakeholderMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<
    Stakeholder | undefined
  >();

  const handleAdd = (data: StakeholderFormData) => {
    createStakeholder.mutate(
      { product_id: productId, ...data },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  const handleEdit = (data: StakeholderFormData) => {
    if (!editingStakeholder) return;
    updateStakeholder.mutate(
      { id: editingStakeholder.id, ...data },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingStakeholder(undefined);
        },
      },
    );
  };

  const openEdit = (stakeholder: Stakeholder) => {
    setEditingStakeholder(stakeholder);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingStakeholder(undefined);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Stakeholders ({stakeholders.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {stakeholders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No stakeholders added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {stakeholders.map((s) => (
                <StakeholderCard
                  key={s.id}
                  stakeholder={s}
                  onEdit={() => openEdit(s)}
                  onDelete={() =>
                    deleteStakeholder.mutate({
                      id: s.id,
                      productId,
                    })
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StakeholderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        stakeholder={editingStakeholder}
        onSubmit={editingStakeholder ? handleEdit : handleAdd}
        isSubmitting={
          createStakeholder.isPending || updateStakeholder.isPending
        }
      />
    </>
  );
}

function StakeholderCard({
  stakeholder,
  onEdit,
  onDelete,
}: {
  stakeholder: Stakeholder;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const roleLabel =
    STAKEHOLDER_ROLE_LABELS[stakeholder.role as StakeholderRole] ??
    stakeholder.role;

  return (
    <div className="flex items-start justify-between rounded-lg border p-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{stakeholder.name}</span>
          <Badge variant="outline" className="text-xs">
            {roleLabel}
          </Badge>
          {stakeholder.is_external && (
            <Badge variant="secondary" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-0.5" />
              External
            </Badge>
          )}
        </div>
        {stakeholder.email && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            {stakeholder.email}
          </div>
        )}
        {stakeholder.responsibilities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {stakeholder.responsibilities.map((r) => (
              <Badge key={r} variant="secondary" className="text-xs">
                {r}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export { StakeholdersList };
export type { StakeholdersListProps };
