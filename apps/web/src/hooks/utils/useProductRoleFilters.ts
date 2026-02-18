"use client";

import { useState, useMemo, useCallback } from "react";
import { useAllProductMembers } from "@/hooks/queries/useProductMembers";
import type { ProductMember, ProfileSummary } from "@/lib/types";

const ROLE_FILTER_DEFS = [
  { key: "pm", label: "PM" },
  { key: "ai_engineer", label: "Engineer" },
  { key: "business_owner", label: "Bus. Owner" },
  { key: "marketing", label: "Marketing" },
] as const;

export type RoleKey = (typeof ROLE_FILTER_DEFS)[number]["key"];

function buildRoleProfiles(
  members: ProductMember[],
): Record<RoleKey, ProfileSummary[]> {
  const seen: Record<string, Set<string>> = {};
  const result: Record<string, ProfileSummary[]> = {};

  for (const def of ROLE_FILTER_DEFS) {
    seen[def.key] = new Set();
    result[def.key] = [];
  }

  for (const m of members) {
    if (!m.role || !m.profile) continue;
    if (seen[m.role] && !seen[m.role].has(m.profile.id)) {
      seen[m.role].add(m.profile.id);
      result[m.role].push(m.profile);
    }
  }
  return result as Record<RoleKey, ProfileSummary[]>;
}

function buildMemberLookup(
  members: ProductMember[],
): Map<string, ProductMember[]> {
  const map = new Map<string, ProductMember[]>();
  for (const m of members) {
    const list = map.get(m.product_id) ?? [];
    list.push(m);
    map.set(m.product_id, list);
  }
  return map;
}

const DEFAULT_VALUES: Record<RoleKey, string> = {
  pm: "all",
  ai_engineer: "all",
  business_owner: "all",
  marketing: "all",
};

export function useProductRoleFilters() {
  const { data: allMembers = [] } = useAllProductMembers();
  const [values, setValues] = useState<Record<RoleKey, string>>({ ...DEFAULT_VALUES });

  const memberLookup = useMemo(() => buildMemberLookup(allMembers), [allMembers]);
  const roleProfiles = useMemo(() => buildRoleProfiles(allMembers), [allMembers]);

  const anyActive = Object.values(values).some((v) => v !== "all");

  const matchesProduct = useCallback(
    (productId: string) => {
      const members = memberLookup.get(productId) ?? [];
      return ROLE_FILTER_DEFS.every(({ key }) => {
        if (values[key] === "all") return true;
        return members.some((m) => m.role === key && m.profile_id === values[key]);
      });
    },
    [memberLookup, values],
  );

  const reset = useCallback(() => setValues({ ...DEFAULT_VALUES }), []);

  const roleFilters = ROLE_FILTER_DEFS.map(({ key, label }) => ({
    value: values[key],
    onChange: (v: string) => setValues((prev) => ({ ...prev, [key]: v })),
    label,
    profiles: roleProfiles[key] ?? [],
  }));

  return { roleFilters, anyActive, matchesProduct, reset, allMembers };
}
