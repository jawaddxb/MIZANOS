"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { SkillTag } from "@/components/atoms/display/SkillTag";
import { useInviteUser } from "@/hooks/queries/useUserManagement";

const ROLES = [
  { value: "admin", label: "Senior Management" },
  { value: "pm", label: "Project Manager" },
  { value: "engineer", label: "AI Engineer" },
  { value: "bizdev", label: "Business Development" },
  { value: "marketing", label: "Marketing" },
] as const;

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

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTeamMemberDialog({ open, onOpenChange }: AddTeamMemberDialogProps) {
  const inviteUser = useInviteUser();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("engineer");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [availability, setAvailability] = useState("available");
  const [maxProjects, setMaxProjects] = useState(3);
  const [officeLocation, setOfficeLocation] = useState("lahore");

  if (!open) return null;

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setRole("engineer");
    setSkills([]);
    setSkillInput("");
    setAvailability("available");
    setMaxProjects(3);
    setOfficeLocation("lahore");
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim().toLowerCase();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
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
            <SelectField label="Role *" value={role} onChange={setRole} options={ROLES} />
            <SelectField label="Availability" value={availability} onChange={setAvailability} options={AVAILABILITY} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Office Location" value={officeLocation} onChange={setOfficeLocation} options={OFFICES} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max Projects</label>
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

          {/* Skills tag input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Skills</label>
            <div className="flex gap-2">
              <input
                placeholder="Add skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); }
                }}
                className="flex-1 h-9 rounded-md border bg-background px-3 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddSkill}>
                Add
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((skill) => (
                  <SkillTag
                    key={skill}
                    skill={skill}
                    onRemove={() => setSkills(skills.filter((s) => s !== skill))}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!email || !fullName || inviteUser.isPending}>
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
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-md border bg-background px-3 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
