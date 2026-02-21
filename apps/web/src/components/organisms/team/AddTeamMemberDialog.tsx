"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/molecules/buttons/Button";
import { SearchableSelect } from "@/components/molecules/forms/SearchableSelect";
import { useInviteUser } from "@/hooks/queries/useUserManagement";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { useSendActivationEmailOnInvite, useShowPendingProfiles } from "@/hooks/queries/useOrgSettings";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";
import { APP_ROLES, ROLE_CONFIG, getInvitableRoles } from "@/lib/constants/roles";

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

const TITLE_OPTIONS = [
  "Chief Executive Officer", "Chief Operating Officer", "Chief Strategy Officer",
  "Head of Marketing and Growth", "Head of Engineering", "Head of Operations",
  "Project Manager", "Product Owner", "PM/PO",
  "Business Development", "Software Engineer", "AI Engineer",
  "Marketing Manager", "SEO Specialist", "Analytics",
  "UI/UX Designer", "QA Engineer", "Content Creator",
] as const;

const SKILL_OPTIONS = [
  "Leadership", "Strategy", "Business Development", "Finance",
  "Product Management", "Project Management", "Marketing", "UI/UX Design", 
  "Software Engineering", "Vibe Coding", "Blockchain", "AI & ML", "Operations",
  "Cloud & Infra", "Quality Assurance",
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
  const { userRoles } = useRoleVisibility();

  const invitableSet = useMemo(() => getInvitableRoles(userRoles), [userRoles]);
  const roleOptions = useMemo(
    () => APP_ROLES.map((r) => ({ value: r, label: ROLE_CONFIG[r].label, disabled: !invitableSet.has(r) })),
    [invitableSet],
  );

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
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
    setTitle("");
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
        title: title || undefined,
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
      <div className="relative z-50 w-full max-w-lg max-h-[85vh] flex flex-col rounded-lg border bg-background shadow-lg">
        <div className="overflow-y-auto flex-1 min-h-0 p-6 pb-0">
        <h2 className="text-lg font-semibold mb-4">Add Team Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email *" value={email} onChange={setEmail} type="email" required />
            <FormField label="Full Name *" value={fullName} onChange={setFullName} required />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <input
              list="title-options"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Select or type a title..."
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            />
            <datalist id="title-options">
              {TITLE_OPTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Primary Role *" value={role} onChange={setRole} options={roleOptions} placeholder="Select role..." />
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

          <p className="text-xs text-muted-foreground pb-4">
            {sendEmailEnabled
              ? "An invitation email will be sent to activate their account."
              : "Account will be created without sending an activation email."}
          </p>
        </form>
        </div>

        <div className="flex justify-end gap-2 p-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!email || !fullName || !role || !officeLocation || inviteUser.isPending}
            onClick={handleSubmit}
          >
            {inviteUser.isPending ? "Inviting..." : "Invite Member"}
          </Button>
        </div>
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
  options: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
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
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
