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
import { SearchableSelect } from "@/components/molecules/forms/SearchableSelect";
import { useInviteUser } from "@/hooks/queries/useUserManagement";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";
import { Loader2 } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  managerOptions?: { value: string; label: string }[];
}

const ALL_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "pm", label: "PM" },
  { value: "engineer", label: "Engineer" },
  { value: "bizdev", label: "BizDev" },
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operations" },
];

const INVITE_MATRIX: Record<string, Set<string>> = {
  business_owner: new Set(["superadmin", "admin", "pm", "engineer", "bizdev", "marketing", "operations"]),
  superadmin: new Set(["admin", "pm", "engineer", "bizdev", "marketing", "operations"]),
  admin: new Set(["pm", "engineer", "bizdev", "marketing", "operations"]),
  pm: new Set(["engineer"]),
};

function getAvailableRoles(primaryRole: string | null): { value: string; label: string }[] {
  if (!primaryRole) return [];
  const allowed = INVITE_MATRIX[primaryRole];
  if (!allowed) return [];
  return ALL_ROLE_OPTIONS.filter((o) => allowed.has(o.value));
}

const OFFICE_OPTIONS = [
  { value: "lahore", label: "Lahore" },
  { value: "dubai", label: "Dubai" },
  { value: "uk", label: "United Kingdom" },
  { value: "europe", label: "Europe" },
];

const SKILL_OPTIONS = [
  "Leadership", "Strategy", "Business Development",
  "Product Management", "Project Management", "Finance",
  "Marketing", "Sales", "Operations",
  "Software Engineering", "AI & Machine Learning",
  "Cloud & Infrastructure", "Data & Analytics", "Blockchain",
  "UI/UX Design", "Quality Assurance", "Research", "Vibe Coding",
];

interface InviteFormState {
  email: string;
  full_name: string;
  role: string;
  office_location: string;
  skills: string[];
  max_projects: string;
  skillInput: string;
  reports_to: string;
}

const INITIAL_STATE: InviteFormState = {
  email: "",
  full_name: "",
  role: "",
  office_location: "",
  skills: [],
  max_projects: "",
  skillInput: "",
  reports_to: "",
};

export function InviteUserDialog({ open, onOpenChange, managerOptions }: InviteUserDialogProps) {
  const [form, setForm] = useState<InviteFormState>(INITIAL_STATE);
  const inviteUser = useInviteUser();
  const { primaryRole } = useRoleVisibility();
  const roleOptions = getAvailableRoles(primaryRole);

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
        reports_to: form.reports_to || undefined,
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
              options={roleOptions}
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
          {managerOptions && managerOptions.length > 0 && (
            <SearchableSelect
              label="Reports To (optional)"
              options={managerOptions}
              value={form.reports_to}
              onValueChange={(v) => setForm({ ...form, reports_to: v })}
              placeholder="Search by name..."
              allowClear
              clearLabel="None"
            />
          )}
          <div className="space-y-2">
            <BaseLabel htmlFor="invite-max-projects">Max Projects (concurrent)</BaseLabel>
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
          <div className="space-y-2">
            <BaseLabel>Skills</BaseLabel>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map((skill) => {
                const selected = form.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        skills: selected ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
                      }))
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-input hover:border-foreground/30"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
              {form.skills.filter((s) => !SKILL_OPTIONS.includes(s)).map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors bg-primary text-primary-foreground border-primary"
                >
                  {skill} &times;
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <BaseInput
                value={form.skillInput}
                onChange={(e) => setForm({ ...form, skillInput: e.target.value })}
                placeholder="Add custom skill..."
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
