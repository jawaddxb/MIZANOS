"use client";

import { useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { useAllUserOverrides } from "@/hooks/queries/usePermissions";
import { useDeleteUserOverride } from "@/hooks/mutations/usePermissionMutations";
import { format } from "date-fns";
import { Plus, Trash2, Loader2, Users } from "lucide-react";

interface UserOverridesPanelProps {
  onAddOverride?: () => void;
}

export function UserOverridesPanel({ onAddOverride }: UserOverridesPanelProps) {
  const { data: overrides = [], isLoading } = useAllUserOverrides();
  const deleteOverride = useDeleteUserOverride();

  const handleDelete = useCallback(
    (id: string) => {
      deleteOverride.mutate(id);
    },
    [deleteOverride],
  );

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Overrides
            </h3>
            <p className="text-sm text-muted-foreground">
              Individual permission exceptions that override role-based access
            </p>
          </div>
          {onAddOverride && (
            <Button size="sm" onClick={onAddOverride}>
              <Plus className="h-4 w-4 mr-2" />
              Add Override
            </Button>
          )}
        </div>
      </div>
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : overrides.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No user overrides configured.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Feature</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Reason</th>
                  <th className="text-left py-3 px-4 font-medium">Expires</th>
                  <th className="w-[50px] py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {overrides.map((override) => (
                  <tr key={override.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4 text-xs font-mono">
                      {override.user_id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4">{override.feature_key}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          override.override_type === "grant"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {override.override_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">
                      {override.reason ?? "--"}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {override.expires_at
                        ? format(new Date(override.expires_at), "MMM d, yyyy")
                        : "Never"}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(override.id)}
                        disabled={deleteOverride.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
