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
import { Button } from "@/components/molecules/buttons/Button";
import { SelectField } from "@/components/molecules/forms/SelectField";
import { useFeaturePermissions } from "@/hooks/queries/usePermissions";
import { useUsers } from "@/hooks/queries/useUserManagement";
import { useCreateUserOverride } from "@/hooks/mutations/usePermissionMutations";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

interface AddOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OverrideFormState {
  user_id: string;
  feature_key: string;
  override_type: string;
  reason: string;
  expires_at: string;
}

const INITIAL_STATE: OverrideFormState = {
  user_id: "",
  feature_key: "",
  override_type: "",
  reason: "",
  expires_at: "",
};

const OVERRIDE_TYPE_OPTIONS = [
  { value: "grant", label: "Grant" },
  { value: "deny", label: "Deny" },
];

export function AddOverrideDialog({ open, onOpenChange }: AddOverrideDialogProps) {
  const [form, setForm] = useState<OverrideFormState>(INITIAL_STATE);
  const { data: features = [] } = useFeaturePermissions();
  const { data: users = [] } = useUsers();
  const createOverride = useCreateUserOverride();

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.full_name ?? u.email ?? u.id.slice(0, 8),
      })),
    [users],
  );

  const featureOptions = useMemo(
    () =>
      features.map((f) => ({
        value: f.feature_key,
        label: f.feature_name,
      })),
    [features],
  );

  const handleClose = useCallback(
    (v: boolean) => {
      if (!v) setForm(INITIAL_STATE);
      onOpenChange(v);
    },
    [onOpenChange],
  );

  const handleSubmit = useCallback(() => {
    if (!form.user_id || !form.feature_key || !form.override_type) return;
    createOverride.mutate(
      {
        user_id: form.user_id,
        feature_key: form.feature_key,
        override_type: form.override_type as "grant" | "deny",
        reason: form.reason || undefined,
        expires_at: form.expires_at || undefined,
      },
      { onSuccess: () => handleClose(false) },
    );
  }, [form, createOverride, handleClose]);

  const isValid = form.user_id && form.feature_key && form.override_type;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Permission Override</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <SelectField
            label="User *"
            options={userOptions}
            value={form.user_id}
            onValueChange={(v) => setForm({ ...form, user_id: v })}
            placeholder="Select user"
          />
          <SelectField
            label="Feature *"
            options={featureOptions}
            value={form.feature_key}
            onValueChange={(v) => setForm({ ...form, feature_key: v })}
            placeholder="Select feature"
          />
          <SelectField
            label="Override Type *"
            options={OVERRIDE_TYPE_OPTIONS}
            value={form.override_type}
            onValueChange={(v) => setForm({ ...form, override_type: v })}
            placeholder="Grant or Deny"
          />
          <div className="space-y-2">
            <BaseLabel htmlFor="override-reason">Reason</BaseLabel>
            <BaseInput
              id="override-reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Why is this override needed?"
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="override-expires">Expires At</BaseLabel>
            <BaseInput
              id="override-expires"
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || createOverride.isPending}>
            {createOverride.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
