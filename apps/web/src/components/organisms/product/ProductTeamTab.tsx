"use client";

import { useMemo } from "react";
import { useTeamReadiness } from "@/hooks/queries/useProductMembers";
import {
  useAddProductMember,
  useRemoveProductMember,
} from "@/hooks/mutations/useProductMemberMutations";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";
import { TeamReadinessBanner } from "@/components/molecules/team/TeamReadinessBanner";
import { TeamRoleSection } from "@/components/molecules/team/TeamRoleSection";
import type { ProductMemberRole } from "@/lib/types";

interface RoleConfig {
  key: ProductMemberRole;
  label: string;
  allowMultiple: boolean;
}

const ROLE_CONFIG: RoleConfig[] = [
  { key: "pm", label: "Project Manager", allowMultiple: false },
  { key: "ai_engineer", label: "AI Engineers", allowMultiple: true },
  { key: "business_owner", label: "Business Owner", allowMultiple: false },
  { key: "marketing", label: "Marketing", allowMultiple: false },
];

interface ProductTeamTabProps {
  productId: string;
}

export function ProductTeamTab({ productId }: ProductTeamTabProps) {
  const { data: readiness, isLoading } = useTeamReadiness(productId);
  const { data: profiles = [] } = useProfiles();
  const { isAdmin, isPM } = useRoleVisibility();
  const addMember = useAddProductMember(productId);
  const removeMember = useRemoveProductMember(productId);

  const canManage = isAdmin || isPM;
  const members = readiness?.members ?? [];

  const membersByRole = useMemo(() => {
    const grouped = new Map<string, typeof members>();
    for (const role of ROLE_CONFIG) {
      grouped.set(role.key, members.filter((m) => m.role === role.key));
    }
    return grouped;
  }, [members]);

  const allMemberProfileIds = useMemo(
    () => new Set(members.map((m) => m.profile_id)),
    [members],
  );

  const handleAdd = (profileId: string, role: string) => {
    addMember.mutate({ profile_id: profileId, role });
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Loading team...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TeamReadinessBanner
        complete={readiness?.complete ?? false}
        missing={readiness?.missing ?? []}
      />

      <div className="space-y-3">
        {ROLE_CONFIG.map((role) => (
          <TeamRoleSection
            key={role.key}
            label={role.label}
            role={role.key}
            members={membersByRole.get(role.key) ?? []}
            allowMultiple={role.allowMultiple}
            canManage={canManage}
            profiles={profiles}
            allMemberProfileIds={allMemberProfileIds}
            onAdd={handleAdd}
            onRemove={(memberId) => removeMember.mutate(memberId)}
            isAdding={addMember.isPending}
            isRemoving={removeMember.isPending}
          />
        ))}
      </div>
    </div>
  );
}
