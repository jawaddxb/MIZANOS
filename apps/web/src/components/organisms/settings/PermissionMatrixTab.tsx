"use client";

import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/layout/Tabs";
import { settingsRepository } from "@/lib/api/repositories";
import type { FeaturePermission } from "@/lib/types";
import type { AppRole } from "@/lib/types/enums";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Search, Shield, Users, History } from "lucide-react";

interface PermissionMatrixTabProps {
  className?: string;
  overridesPanel?: React.ReactNode;
  auditLogPanel?: React.ReactNode;
}

const ROLES: { key: AppRole; label: string; tier: number }[] = [
  { key: "business_owner", label: "Owner", tier: 0 },
  { key: "superadmin", label: "Super Admin", tier: 0 },
  { key: "admin", label: "Admin", tier: 1 },
  { key: "pm", label: "PM", tier: 2 },
  { key: "engineer", label: "Engineer", tier: 3 },
  { key: "bizdev", label: "BizDev", tier: 3 },
  { key: "marketing", label: "Marketing", tier: 3 },
  { key: "operations", label: "Operations", tier: 3 },
];

const CAT_LABELS: Record<string, string> = {
  admin: "Administration", navigation: "Navigation", project: "Project Features",
  marketing: "Marketing", confidential: "Confidential",
};

function useFeaturePermissions() {
  return useQuery({ queryKey: ["settings", "feature-permissions"], queryFn: () => settingsRepository.getFeaturePermissions() });
}

function useRolePermissions() {
  return useQuery({ queryKey: ["settings", "role-permissions"], queryFn: () => settingsRepository.getRolePermissions() });
}

function useUpdateRolePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ permissionId, canAccess }: { permissionId: string; canAccess: boolean }) =>
      settingsRepository.updateRolePermission(permissionId, { can_access: canAccess }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", "role-permissions"] }); },
  });
}

export function PermissionMatrixTab({ className, overridesPanel, auditLogPanel }: PermissionMatrixTabProps) {
  const { data: features = [], isLoading: lf } = useFeaturePermissions();
  const { data: rolePermissions = [], isLoading: lp } = useRolePermissions();
  const updatePerm = useUpdateRolePermission();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const permMap = useMemo(() => {
    const m = new Map<string, { id: string; canAccess: boolean }>();
    rolePermissions.forEach((rp) => m.set(`${rp.role}:${rp.feature_key}`, { id: rp.id, canAccess: rp.can_access }));
    return m;
  }, [rolePermissions]);

  const getPerm = useCallback((role: string, key: string) => permMap.get(`${role}:${key}`), [permMap]);

  const grouped = useMemo(() => {
    const filtered = features.filter((f) => {
      const ms = !searchQuery || f.feature_name.toLowerCase().includes(searchQuery.toLowerCase()) || f.feature_key.toLowerCase().includes(searchQuery.toLowerCase());
      return ms && (categoryFilter === "all" || f.category === categoryFilter);
    });
    const g: Record<string, FeaturePermission[]> = {};
    filtered.forEach((f) => { if (!g[f.category]) g[f.category] = []; g[f.category].push(f); });
    return g;
  }, [features, searchQuery, categoryFilter]);

  const categories = useMemo(() => [...new Set(features.map((f) => f.category))], [features]);
  const isLoading = lf || lp;

  const handleToggle = useCallback((role: string, featureKey: string) => {
    const p = getPerm(role, featureKey);
    if (p) updatePerm.mutate({ permissionId: p.id, canAccess: !p.canAccess });
  }, [getPerm, updatePerm]);

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5" />Authority Matrix</h2>
        <p className="text-sm text-muted-foreground">Configure feature access for each role. Use overrides for individual user exceptions.</p>
      </div>
      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix" className="gap-2"><Shield className="h-4 w-4" />Role Matrix</TabsTrigger>
          <TabsTrigger value="overrides" className="gap-2"><Users className="h-4 w-4" />User Overrides</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><History className="h-4 w-4" />Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value="matrix" className="mt-4">
          <Card>
            <div className="p-6 pb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <BaseInput placeholder="Search features..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="all">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{CAT_LABELS[c] ?? c}</option>)}
              </select>
            </div>
            <div className="px-6 pb-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium min-w-[200px]">Feature</th>
                        {ROLES.map((r) => (
                          <th key={r.key} className="text-center py-3 px-3 font-medium">
                            <div className="flex flex-col items-center gap-1">
                              <span>{r.label}</span>
                              {r.tier === 0 ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 text-green-600 border-green-300">Full Access</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5">Tier {r.tier}</Badge>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(grouped).map(([cat, feats]) => (
                        <CategoryRows key={cat} category={cat} features={feats} getPerm={getPerm} onToggle={handleToggle} isPending={updatePerm.isPending} />
                      ))}
                    </tbody>
                  </table>
                  {Object.keys(grouped).length === 0 && <div className="text-center py-8 text-muted-foreground">No features match your search.</div>}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="overrides" className="mt-4">
          {overridesPanel ?? <Card><div className="p-8 text-center text-muted-foreground">User overrides panel not configured.</div></Card>}
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          {auditLogPanel ?? <Card><div className="p-8 text-center text-muted-foreground">Audit log panel not configured.</div></Card>}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoryRows({ category, features, getPerm, onToggle, isPending }: {
  category: string; features: FeaturePermission[];
  getPerm: (role: string, key: string) => { id: string; canAccess: boolean } | undefined;
  onToggle: (role: string, key: string) => void; isPending: boolean;
}) {
  return (
    <>
      <tr>
        <td colSpan={ROLES.length + 1} className="py-2 px-2 bg-muted/50 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
          {CAT_LABELS[category] ?? category}
        </td>
      </tr>
      {features.map((f) => (
        <tr key={f.feature_key} className="border-b hover:bg-muted/30">
          <td className="py-3 px-2">
            <div className="font-medium">{f.feature_name}</div>
            {f.description && <div className="text-xs text-muted-foreground">{f.description}</div>}
          </td>
          {ROLES.map((r) => {
            if (r.tier === 0) {
              return (
                <td key={r.key} className="text-center py-3 px-3">
                  <Lock className="h-3.5 w-3.5 text-green-500 mx-auto" />
                </td>
              );
            }
            const p = getPerm(r.key, f.feature_key);
            const on = p?.canAccess ?? false;
            return (
              <td key={r.key} className="text-center py-3 px-3">
                <BaseCheckbox checked={on} onCheckedChange={() => onToggle(r.key, f.feature_key)} disabled={isPending}
                  className={on ? "border-green-500 bg-green-500 data-[state=checked]:bg-green-500" : ""} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
