"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { Button } from "@/components/molecules/buttons/Button";
import { useUserRoles } from "@/hooks/queries/useUserRoles";
import {
  useAssignRole,
  useRemoveRole,
  useUpdatePrimaryRole,
} from "@/hooks/mutations/useRoleMutations";
import { APP_ROLES, ROLE_CONFIG } from "@/lib/constants/roles";
import type { Profile } from "@/lib/types/user";
import type { AppRole } from "@/lib/types/enums";
import { toast } from "sonner";

interface UserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}

export function UserRolesDialog({ open, onOpenChange, profile }: UserRolesDialogProps) {
  const { data: userRoles = [] } = useUserRoles(profile.id);
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const updatePrimaryRole = useUpdatePrimaryRole();

  const dbRoles = useMemo(() => {
    const set = new Set<AppRole>();
    if (profile.role) set.add(profile.role as AppRole);
    for (const ur of userRoles) set.add(ur.role as AppRole);
    return set;
  }, [profile.role, userRoles]);

  const dbPrimary = (profile.role ?? "") as AppRole;

  const [selected, setSelected] = useState<Set<AppRole>>(new Set(dbRoles));
  const [primary, setPrimary] = useState<AppRole>(dbPrimary);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(new Set(dbRoles));
      setPrimary(dbPrimary);
    }
  }, [open, dbRoles, dbPrimary]);

  const hasChanges = useMemo(() => {
    if (primary !== dbPrimary) return true;
    if (selected.size !== dbRoles.size) return true;
    for (const r of selected) {
      if (!dbRoles.has(r)) return true;
    }
    return false;
  }, [selected, primary, dbRoles, dbPrimary]);

  const toggleRole = useCallback((role: AppRole) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        if (next.size <= 1) return prev;
        next.delete(role);
        if (primary === role) {
          setPrimary([...next][0]);
        }
      } else {
        next.add(role);
      }
      return next;
    });
  }, [primary]);

  const handleSave = async () => {
    setSaving(true);
    const userId = profile.id;
    const rolesToRemove = [...dbRoles].filter((r) => !selected.has(r));
    const rolesToAdd = [...selected].filter((r) => !dbRoles.has(r));
    const primaryChanged = primary !== dbPrimary;

    try {
      for (const role of rolesToRemove) {
        await removeRole.mutateAsync({ userId, role });
      }
      for (const role of rolesToAdd) {
        await assignRole.mutateAsync({ userId, role });
      }
      if (primaryChanged) {
        await updatePrimaryRole.mutateAsync({ userId, role: primary });
      }
      toast.success("Roles updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update roles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Roles — {profile.full_name}</DialogTitle>
          <ul className="text-xs text-muted-foreground mt-3 space-y-0.5 list-disc list-inside">
            <li>Highlighted <Star className="inline h-3 w-3 fill-yellow-400 text-yellow-400 -mt-0.5" /> represents the primary role</li>
            <li>Check roles to assign as secondary roles</li>
          </ul>
        </DialogHeader>

        <hr className="border-border -mt-1" />

        <div className="space-y-1 py-2 max-h-[60vh] overflow-y-auto -mx-2 px-2">
          {APP_ROLES.map((role) => {
            const checked = selected.has(role);
            const isPrimary = checked && primary === role;
            const config = ROLE_CONFIG[role];

            return (
              <label
                key={role}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <BaseCheckbox
                  checked={checked}
                  onCheckedChange={() => toggleRole(role)}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{config.label}</span>
                  <p className="text-xs text-muted-foreground leading-tight">{config.description}</p>
                </div>
                {checked ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPrimary(role);
                    }}
                    className="shrink-0 p-1 rounded hover:bg-accent"
                    title={isPrimary ? "Primary role" : "Set as primary role"}
                  >
                    <Star
                      className={`h-4 w-4 ${isPrimary ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                    />
                  </button>
                ) : (
                  <span className="shrink-0 w-6" />
                )}
              </label>
            );
          })}
        </div>

        {hasChanges && (
          <p className="text-xs text-amber-500 text-center">Unsaved changes</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
