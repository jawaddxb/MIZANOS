"use client";

import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import { SelectField } from "@/components/molecules/forms/SelectField";
import type { Stakeholder, StakeholderRole } from "@/lib/types";
import { STAKEHOLDER_ROLE_LABELS } from "@/lib/types";

interface StakeholderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  stakeholder?: Stakeholder;
  onSubmit: (data: StakeholderFormData) => void;
  isSubmitting?: boolean;
}

interface StakeholderFormData {
  name: string;
  role: StakeholderRole;
  email: string;
  is_external: boolean;
  responsibilities: string[];
}

const ROLE_OPTIONS = Object.entries(STAKEHOLDER_ROLE_LABELS) as [
  StakeholderRole,
  string,
][];

function StakeholderDialog({
  open,
  onOpenChange,
  stakeholder,
  onSubmit,
  isSubmitting,
}: StakeholderDialogProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<StakeholderRole>("pm");
  const [email, setEmail] = useState("");
  const [isExternal, setIsExternal] = useState(false);
  const [responsibilitiesText, setResponsibilitiesText] = useState("");

  useEffect(() => {
    if (stakeholder) {
      setName(stakeholder.name);
      setRole(stakeholder.role);
      setEmail(stakeholder.email ?? "");
      setIsExternal(stakeholder.is_external);
      setResponsibilitiesText(stakeholder.responsibilities.join(", "));
    } else {
      setName("");
      setRole("pm");
      setEmail("");
      setIsExternal(false);
      setResponsibilitiesText("");
    }
  }, [stakeholder, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const responsibilities = responsibilitiesText
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    onSubmit({ name, role, email, is_external: isExternal, responsibilities });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {stakeholder ? "Edit Stakeholder" : "Add Stakeholder"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <BaseLabel htmlFor="stakeholder-name">Name</BaseLabel>
            <BaseInput
              id="stakeholder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Full name"
            />
          </div>

          <SelectField
            label="Role"
            id="stakeholder-role"
            value={role}
            onValueChange={(v) => setRole(v as StakeholderRole)}
            options={ROLE_OPTIONS.map(([value, label]) => ({
              value,
              label,
            }))}
          />

          <div>
            <BaseLabel htmlFor="stakeholder-email">Email</BaseLabel>
            <BaseInput
              id="stakeholder-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <BaseLabel htmlFor="stakeholder-responsibilities">
              Responsibilities (comma-separated)
            </BaseLabel>
            <BaseInput
              id="stakeholder-responsibilities"
              value={responsibilitiesText}
              onChange={(e) => setResponsibilitiesText(e.target.value)}
              placeholder="Review specs, Approve releases"
            />
          </div>

          <div className="flex items-center gap-2">
            <BaseSwitch
              id="stakeholder-external"
              checked={isExternal}
              onCheckedChange={setIsExternal}
            />
            <BaseLabel htmlFor="stakeholder-external">
              External stakeholder
            </BaseLabel>
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
              {stakeholder ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { StakeholderDialog };
export type { StakeholderDialogProps, StakeholderFormData };
