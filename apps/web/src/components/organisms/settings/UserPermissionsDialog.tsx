"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Badge } from "@/components/atoms/display/Badge";
import { Card } from "@/components/atoms/display/Card";
import {
  useFeaturePermissions,
  useRolePermissions,
  useUserOverrides,
} from "@/hooks/queries/usePermissions";
import type { Profile } from "@/lib/types";
import { Shield, Check, X, Loader2 } from "lucide-react";
import { useMemo } from "react";

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
}

export function UserPermissionsDialog({
  open,
  onOpenChange,
  profile,
}: UserPermissionsDialogProps) {
  const { data: features = [], isLoading: loadingFeatures } = useFeaturePermissions();
  const { data: rolePermissions = [], isLoading: loadingRoles } = useRolePermissions();
  const { data: overrides = [], isLoading: loadingOverrides } = useUserOverrides(
    profile?.user_id,
  );

  const roleAccess = useMemo(() => {
    if (!profile?.role) return new Set<string>();
    const set = new Set<string>();
    rolePermissions.forEach((rp) => {
      if (rp.role === profile.role && rp.can_access) {
        set.add(rp.feature_key);
      }
    });
    return set;
  }, [rolePermissions, profile?.role]);

  const overrideMap = useMemo(() => {
    const map = new Map<string, "grant" | "deny">();
    overrides.forEach((o) => {
      const expired = o.expires_at && new Date(o.expires_at) < new Date();
      if (!expired) map.set(o.feature_key, o.override_type);
    });
    return map;
  }, [overrides]);

  const isLoading = loadingFeatures || loadingRoles || loadingOverrides;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions: {profile?.full_name ?? "User"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Role:</span>
            <Badge>{profile?.role?.toUpperCase() ?? "None"}</Badge>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Feature</th>
                      <th className="text-center py-2 font-medium w-20">Role</th>
                      <th className="text-center py-2 font-medium w-24">Override</th>
                      <th className="text-center py-2 font-medium w-20">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feat) => {
                      const fromRole = roleAccess.has(feat.feature_key);
                      const override = overrideMap.get(feat.feature_key);
                      const finalAccess = override
                        ? override === "grant"
                        : fromRole;

                      return (
                        <tr key={feat.feature_key} className="border-b last:border-0">
                          <td className="py-2">
                            <div className="font-medium">{feat.feature_name}</div>
                          </td>
                          <td className="text-center py-2">
                            <AccessIcon allowed={fromRole} />
                          </td>
                          <td className="text-center py-2">
                            {override ? (
                              <Badge
                                variant={override === "grant" ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {override}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">--</span>
                            )}
                          </td>
                          <td className="text-center py-2">
                            <AccessIcon allowed={finalAccess} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccessIcon({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <Check className="h-4 w-4 text-green-500 mx-auto" />
  ) : (
    <X className="h-4 w-4 text-red-400 mx-auto" />
  );
}
