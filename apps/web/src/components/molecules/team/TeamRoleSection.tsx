"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { TeamMemberCard } from "./TeamMemberCard";
import { TeamAddMemberForm } from "./TeamAddMemberForm";
import type { ProductMember, Profile } from "@/lib/types";

interface TeamRoleSectionProps {
  label: string;
  role: string;
  members: ProductMember[];
  allowMultiple: boolean;
  canManage: boolean;
  profiles: Profile[];
  allMemberProfileIds: Set<string>;
  onAdd: (profileId: string, role: string) => void;
  onRemove: (memberId: string) => void;
  isAdding: boolean;
  isRemoving: boolean;
}

export function TeamRoleSection({
  label,
  role,
  members,
  allowMultiple,
  canManage,
  profiles,
  allMemberProfileIds,
  onAdd,
  onRemove,
  isAdding,
  isRemoving,
}: TeamRoleSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const hasMembers = members.length > 0;
  const canAddMore = allowMultiple || !hasMembers;

  const handleAdd = (profileId: string) => {
    onAdd(profileId, role);
    setShowForm(false);
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">
          {label}
          {allowMultiple && hasMembers && (
            <span className="text-muted-foreground font-normal ml-1.5">
              ({members.length})
            </span>
          )}
        </h3>
      </div>

      {hasMembers && (
        <div className="space-y-2">
          {members.map((member) => {
            const profile = profiles.find((p) => p.id === member.profile_id);
            const name =
              profile?.full_name ||
              profile?.email ||
              "Unknown";
            return (
              <TeamMemberCard
                key={member.id}
                name={name}
                email={profile?.email ?? null}
                avatarUrl={profile?.avatar_url ?? null}
                canRemove={canManage}
                onRemove={() => onRemove(member.id)}
                isRemoving={isRemoving}
              />
            );
          })}
        </div>
      )}

      {canManage && canAddMore && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors mt-2"
        >
          <Plus className="h-3.5 w-3.5" />
          {hasMembers ? `Add Another ${label.replace(/s$/, "")}` : `Assign ${label}`}
        </button>
      )}

      {showForm && (
        <TeamAddMemberForm
          role={role}
          profiles={profiles}
          excludeProfileIds={allMemberProfileIds}
          onAdd={handleAdd}
          isPending={isAdding}
        />
      )}
    </div>
  );
}
