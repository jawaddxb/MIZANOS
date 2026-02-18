"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { TeamMemberCard } from "./TeamMemberCard";
import { SearchableSelect } from "@/components/molecules/forms/SearchableSelect";
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
  const [showAddMore, setShowAddMore] = useState(false);
  const hasMembers = members.length > 0;
  const canAddMore = allowMultiple || !hasMembers;

  const profileOptions = profiles
    .filter((p) => !allMemberProfileIds.has(p.id))
    .map((p) => ({
      value: p.id,
      label: p.full_name || p.email || "Unknown",
    }));

  const handleSelect = (profileId: string) => {
    if (!profileId) return;
    onAdd(profileId, role);
    setShowAddMore(false);
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
          {members.map((member) => (
            <TeamMemberCard
              key={member.id}
              name={member.profile?.full_name || member.profile?.email || "Unknown"}
              email={member.profile?.email ?? null}
              avatarUrl={member.profile?.avatar_url ?? null}
              canRemove={canManage}
              onRemove={() => onRemove(member.id)}
              isRemoving={isRemoving}
            />
          ))}
        </div>
      )}

      {canManage && canAddMore && !hasMembers && (
        <SearchableSelect
          options={profileOptions}
          value=""
          onValueChange={handleSelect}
          placeholder={`Select ${label}...`}
          emptyLabel="No available members"
        />
      )}

      {canManage && canAddMore && hasMembers && !showAddMore && (
        <button
          type="button"
          onClick={() => setShowAddMore(true)}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors mt-2"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Another
        </button>
      )}

      {showAddMore && (
        <div className="mt-2">
          <SearchableSelect
            options={profileOptions}
            value=""
            onValueChange={handleSelect}
            placeholder={`Select ${label}...`}
            emptyLabel="No available members"
          />
        </div>
      )}
    </div>
  );
}
