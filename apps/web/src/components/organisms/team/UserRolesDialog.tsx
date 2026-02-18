"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { ConfirmActionDialog } from "@/components/molecules/feedback/ConfirmActionDialog";
import { useUserRoles } from "@/hooks/queries/useUserRoles";
import {
  useAssignRole,
  useRemoveRole,
  useUpdatePrimaryRole,
} from "@/hooks/mutations/useRoleMutations";
import { APP_ROLES, ROLE_CONFIG } from "@/lib/constants/roles";
import type { Profile } from "@/lib/types/user";
import type { AppRole } from "@/lib/types/enums";

interface UserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}

interface PendingAction {
  type: "assign" | "remove" | "primary";
  role: string;
}

export function UserRolesDialog({ open, onOpenChange, profile }: UserRolesDialogProps) {
  const { data: userRoles = [] } = useUserRoles(profile.id);
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const updatePrimaryRole = useUpdatePrimaryRole();

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [addRoleValue, setAddRoleValue] = useState("");

  const existingRoleValues = [...userRoles.map((r) => r.role), profile.role].filter(Boolean);
  const availableRoles = APP_ROLES.filter((r) => !existingRoleValues.includes(r));
  const secondaryRoles = userRoles.filter(r => r.role !== profile.role);

  const isPending = assignRole.isPending || removeRole.isPending || updatePrimaryRole.isPending;

  const handleConfirm = () => {
    if (!pendingAction) return;
    const userId = profile.id;
    const onSuccess = () => setPendingAction(null);

    if (pendingAction.type === "assign") {
      assignRole.mutate({ userId, role: pendingAction.role }, { onSuccess });
    } else if (pendingAction.type === "remove") {
      removeRole.mutate({ userId, role: pendingAction.role }, { onSuccess });
    } else if (pendingAction.type === "primary") {
      updatePrimaryRole.mutate({ userId, role: pendingAction.role }, { onSuccess });
    }
  };

  const confirmTitle = pendingAction?.type === "remove" ? "Remove Role" : "Confirm Role Change";
  const confirmDescription = pendingAction
    ? pendingAction.type === "remove"
      ? `Remove the "${ROLE_CONFIG[pendingAction.role as AppRole]?.label ?? pendingAction.role}" role from ${profile.full_name}?`
      : pendingAction.type === "assign"
        ? `Assign the "${ROLE_CONFIG[pendingAction.role as AppRole]?.label ?? pendingAction.role}" role to ${profile.full_name}?`
        : `Change ${profile.full_name}'s primary role to "${ROLE_CONFIG[pendingAction.role as AppRole]?.label ?? pendingAction.role}"?`
    : "";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Roles — {profile.full_name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Role</label>
              <select
                value={profile.role ?? ""}
                onChange={(e) =>
                  setPendingAction({ type: "primary", role: e.target.value })
                }
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              >
                {APP_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_CONFIG[r].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Roles</label>
              {secondaryRoles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {secondaryRoles.map((ur) => (
                    <Badge key={ur.id} variant="secondary" className="gap-1 pr-1">
                      {ROLE_CONFIG[ur.role as AppRole]?.label ?? ur.role}
                      <button
                        onClick={() => setPendingAction({ type: "remove", role: ur.role })}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No additional roles</p>
              )}
            </div>

            {availableRoles.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={addRoleValue}
                  onChange={(e) => setAddRoleValue(e.target.value)}
                  className="flex-1 h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select role to add...</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!addRoleValue}
                  onClick={() => {
                    if (addRoleValue) {
                      setPendingAction({ type: "assign", role: addRoleValue });
                      setAddRoleValue("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={!!pendingAction}
        onOpenChange={(v) => { if (!v) setPendingAction(null); }}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={pendingAction?.type === "remove" ? "Remove" : "Confirm"}
        variant={pendingAction?.type === "remove" ? "destructive" : "default"}
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  );
}
