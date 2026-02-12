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
import { useInviteUser } from "@/hooks/queries/useUserManagement";
import { Loader2, X } from "lucide-react";
import { Badge } from "@/components/atoms/display/Badge";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "pm", label: "PM" },
  { value: "engineer", label: "Engineer" },
  { value: "bizdev", label: "BizDev" },
  { value: "marketing", label: "Marketing" },
];

const OFFICE_OPTIONS = [
  { value: "lahore", label: "Lahore" },
  { value: "dubai", label: "Dubai" },
  { value: "uk", label: "United Kingdom" },
  { value: "europe", label: "Europe" },
];

interface InviteFormState {
  email: string;
  full_name: string;
  role: string;
  office_location: string;
  skills: string[];
  max_projects: string;
  skillInput: string;
}

const INITIAL_STATE: InviteFormState = {
  email: "",
  full_name: "",
  role: "",
  office_location: "",
  skills: [],
  max_projects: "",
  skillInput: "",
};

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const [form, setForm] = useState<InviteFormState>(INITIAL_STATE);
  const inviteUser = useInviteUser();

  const handleClose = useCallback(
    (v: boolean) => {
      if (!v) setForm(INITIAL_STATE);
      onOpenChange(v);
    },
    [onOpenChange],
  );

  const handleAddSkill = useCallback(() => {
    const skill = form.skillInput.trim();
    if (skill && !form.skills.includes(skill)) {
      setForm((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
        skillInput: "",
      }));
    }
  }, [form.skillInput, form.skills]);

  const handleRemoveSkill = useCallback((skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.email || !form.full_name || !form.role) return;
    inviteUser.mutate(
      {
        email: form.email,
        full_name: form.full_name,
        role: form.role,
        office_location: form.office_location || undefined,
        skills: form.skills.length > 0 ? form.skills : undefined,
        max_projects: form.max_projects ? Number(form.max_projects) : undefined,
      },
      { onSuccess: () => handleClose(false) },
    );
  }, [form, inviteUser, handleClose]);

  const isValid = form.email && form.full_name && form.role;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <BaseLabel htmlFor="invite-email">Email *</BaseLabel>
              <BaseInput
                id="invite-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@company.com"
              />
            </div>
            <div className="space-y-2">
              <BaseLabel htmlFor="invite-name">Full Name *</BaseLabel>
              <BaseInput
                id="invite-name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Role *"
              options={ROLE_OPTIONS}
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v })}
              placeholder="Select role"
            />
            <SelectField
              label="Office Location"
              options={OFFICE_OPTIONS}
              value={form.office_location}
              onValueChange={(v) => setForm({ ...form, office_location: v })}
              placeholder="Select office"
            />
          </div>
          <div className="space-y-2">
            <BaseLabel>Skills</BaseLabel>
            <div className="flex gap-2">
              <BaseInput
                value={form.skillInput}
                onChange={(e) => setForm({ ...form, skillInput: e.target.value })}
                placeholder="Add a skill..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddSkill}>
                Add
              </Button>
            </div>
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="invite-max-projects">Max Projects</BaseLabel>
            <BaseInput
              id="invite-max-projects"
              type="number"
              min={1}
              max={20}
              value={form.max_projects}
              onChange={(e) => setForm({ ...form, max_projects: e.target.value })}
              placeholder="e.g., 5"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || inviteUser.isPending}>
            {inviteUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Invite User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
