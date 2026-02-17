"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, Trash2, UserPlus } from "lucide-react";
import { useTeamReadiness } from "@/hooks/queries/useProductMembers";
import {
  useAddProductMember,
  useRemoveProductMember,
} from "@/hooks/mutations/useProductMemberMutations";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";
import { SearchableSelect } from "@/components/molecules/forms/SearchableSelect";
import { Button } from "@/components/molecules/buttons/Button";
import type { ProductMemberRole } from "@/lib/types";

const ROLE_OPTIONS: { value: ProductMemberRole; label: string }[] = [
  { value: "pm", label: "Project Manager" },
  { value: "marketing", label: "Marketing" },
  { value: "senior_management", label: "Senior Management" },
  { value: "ai_engineer", label: "AI Engineer" },
];

const ROLE_LABELS: Record<string, string> = {
  pm: "Project Manager",
  marketing: "Marketing",
  senior_management: "Senior Management",
  ai_engineer: "AI Engineer",
};

interface ProductTeamTabProps {
  productId: string;
}

export function ProductTeamTab({ productId }: ProductTeamTabProps) {
  const { data: readiness, isLoading } = useTeamReadiness(productId);
  const { data: profiles = [] } = useProfiles();
  const { isAdmin, isPM } = useRoleVisibility();
  const addMember = useAddProductMember(productId);
  const removeMember = useRemoveProductMember(productId);

  const [selectedProfile, setSelectedProfile] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const canManage = isAdmin || isPM;

  const profileOptions = profiles.map((p) => ({
    value: p.id,
    label: p.full_name || p.email || "Unknown",
  }));

  const handleAdd = () => {
    if (!selectedProfile || !selectedRole) return;
    addMember.mutate(
      { profile_id: selectedProfile, role: selectedRole },
      {
        onSuccess: () => {
          setSelectedProfile("");
          setSelectedRole("");
        },
      },
    );
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading team...</div>;
  }

  const members = readiness?.members ?? [];

  return (
    <div className="space-y-6">
      <ReadinessBanner complete={readiness?.complete ?? false} missing={readiness?.missing ?? []} />

      {canManage && (
        <div className="flex items-end gap-3 p-4 border rounded-lg bg-muted/30">
          <SearchableSelect
            label="Team Member"
            options={profileOptions}
            value={selectedProfile}
            onValueChange={setSelectedProfile}
            placeholder="Select a person..."
          />
          <SearchableSelect
            label="Role"
            options={ROLE_OPTIONS}
            value={selectedRole}
            onValueChange={setSelectedRole}
            placeholder="Select a role..."
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!selectedProfile || !selectedRole || addMember.isPending}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      )}

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No team members assigned yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((member) => {
            const profile = profiles.find((p) => p.id === member.profile_id);
            return (
              <MemberCard
                key={member.id}
                name={profile?.full_name || profile?.email || "Unknown"}
                avatarUrl={profile?.avatar_url ?? null}
                role={ROLE_LABELS[member.role ?? ""] ?? member.role ?? "—"}
                addedAt={member.created_at}
                canRemove={canManage}
                onRemove={() => removeMember.mutate(member.id)}
                isRemoving={removeMember.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReadinessBanner({ complete, missing }: { complete: boolean; missing: string[] }) {
  if (complete) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">Team Ready</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
      <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
      <div>
        <span className="text-sm font-medium">Incomplete Team</span>
        <p className="text-xs mt-0.5">Missing: {missing.join(", ")}</p>
      </div>
    </div>
  );
}

interface MemberCardProps {
  name: string;
  avatarUrl: string | null;
  role: string;
  addedAt: string;
  canRemove: boolean;
  onRemove: () => void;
  isRemoving: boolean;
}

function MemberCard({ name, avatarUrl, role, addedAt, canRemove, onRemove, isRemoving }: MemberCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {new Date(addedAt).toLocaleDateString()}
      </span>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
