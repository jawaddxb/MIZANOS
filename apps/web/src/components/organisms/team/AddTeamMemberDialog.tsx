"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/molecules/buttons/Button";
import { SearchableSelect } from "@/components/molecules/forms/SearchableSelect";
import { useInviteUser } from "@/hooks/queries/useUserManagement";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { useSendActivationEmailOnInvite, useShowPendingProfiles } from "@/hooks/queries/useOrgSettings";
import { APP_ROLES, ROLE_CONFIG } from "@/lib/constants/roles";

const ROLES = APP_ROLES.map((r) => ({ value: r, label: ROLE_CONFIG[r].label }));

const AVAILABILITY = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "unavailable", label: "Unavailable" },
] as const;

const OFFICES = [
  { value: "lahore", label: "Lahore" },
  { value: "dubai", label: "Dubai" },
  { value: "uk", label: "UK" },
  { value: "europe", label: "Europe" },
] as const;

const SKILL_OPTIONS = [
  "Leadership", "Strategy", "Business Development",
  "Product Management", "Project Management", "Finance",
  "Marketing", "Sales", "Operations",
  "Software Engineering", "AI & Machine Learning",
  "Cloud & Infrastructure", "Data & Analytics", "Blockchain",
  "UI/UX Design", "Quality Assurance", "Research", "Vibe Coding",
] as const;

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTeamMemberDialog({ open, onOpenChange }: AddTeamMemberDialogProps) {
  const inviteUser = useInviteUser();
  const { data: profiles = [] } = useProfiles();
  const sendEmailEnabled = useSendActivationEmailOnInvite();
  const showPending = useShowPendingProfiles();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [availability, setAvailability] = useState("available");
  const [maxProjects, setMaxProjects] = useState(3);
  const [officeLocation, setOfficeLocation] = useState("");
  const [reportsTo, setReportsTo] = useState("");

  if (!open) return null;

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setRole("");
    setSkills([]);
    setCustomSkillInput("");
    setAvailability("available");
    setMaxProjects(3);
    setOfficeLocation("");
    setReportsTo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    inviteUser.mutate(
      {
        email,
        full_name: fullName,
        role,
        skills,
        availability,
        max_projects: maxProjects,
        office_location: officeLocation,
        reports_to: reportsTo || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add Team Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email *" value={email} onChange={setEmail} type="email" required />
            <FormField label="Full Name *" value={fullName} onChange={setFullName} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Primary Role *" value={role} onChange={setRole} options={ROLES} placeholder="Select role..." />
            <SelectField label="Availability" value={availability} onChange={setAvailability} options={AVAILABILITY} />
          </div>

          <SearchableSelect
            label="Reports To (optional)"
            options={profiles
              .filter((p) => p.status === "active" || (showPending && p.status === "pending"))
              .map((p) => ({
                value: p.id,
                label: `${p.full_name ?? p.email ?? p.id} — ${p.role ?? "no role"}${p.status === "pending" ? " (pending activation)" : ""}`,
              }))}
            value={reportsTo}
            onValueChange={setReportsTo}
            placeholder="Search by name..."
            allowClear
            clearLabel="None"
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Office Location *" value={officeLocation} onChange={setOfficeLocation} options={OFFICES} placeholder="Select office..." />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max Projects (concurrent)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxProjects}
                onChange={(e) => setMaxProjects(Number(e.target.value))}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              />
            </div>
          </div>

          {/* Skills selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Skills</label>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map((skill) => {
                const selected = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() =>
                      setSkills(selected ? skills.filter((s) => s !== skill) : [...skills, skill])
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
              {skills.filter((s) => !SKILL_OPTIONS.includes(s as typeof SKILL_OPTIONS[number])).map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setSkills(skills.filter((s) => s !== skill))}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors bg-primary text-primary-foreground border-primary"
                >
                  {skill} &times;
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Add custom skill..."
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = customSkillInput.trim();
                    if (trimmed && !skills.includes(trimmed)) {
                      setSkills([...skills, trimmed]);
                      setCustomSkillInput("");
                    }
                  }
                }}
                className="flex-1 h-8 rounded-md border bg-background px-3 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const trimmed = customSkillInput.trim();
                  if (trimmed && !skills.includes(trimmed)) {
                    setSkills([...skills, trimmed]);
                    setCustomSkillInput("");
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {sendEmailEnabled
              ? "An invitation email will be sent to activate their account."
              : "Account will be created without sending an activation email."}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!email || !fullName || !role || !officeLocation || inviteUser.isPending}>
              {inviteUser.isPending ? "Inviting..." : "Invite Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

function FormField({ label, value, onChange, type = "text", placeholder, required }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-9 rounded-md border bg-background px-3 text-sm"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

function SelectField({ label, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-9 rounded-md border bg-background px-3 text-sm ${!value ? "text-muted-foreground" : ""}`}
      >
        {placeholder && (
          <option value="" disabled>{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
