"use client";

import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { usePermissionAuditLog } from "@/hooks/mutations/usePermissionMutations";
import { format } from "date-fns";
import { History, Loader2 } from "lucide-react";

export function PermissionAuditLog() {
  const { data: logs = [], isLoading } = usePermissionAuditLog();

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5" />
          Permission Audit Log
        </h3>
        <p className="text-sm text-muted-foreground">
          Track all permission changes across roles and users
        </p>
      </div>
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No audit log entries found.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium">Actor</th>
                  <th className="text-left py-3 px-4 font-medium">Action</th>
                  <th className="text-left py-3 px-4 font-medium">Target</th>
                  <th className="text-left py-3 px-4 font-medium">Feature</th>
                  <th className="text-left py-3 px-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {log.changed_by?.slice(0, 8) ?? "--"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {log.action_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {log.target_role ?? log.target_user_id?.slice(0, 8) ?? "--"}
                    </td>
                    <td className="py-3 px-4">{log.feature_key}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate">
                      {formatDetails(log.old_value, log.new_value)}
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

function formatDetails(
  oldVal: Record<string, unknown> | null,
  newVal: Record<string, unknown> | null,
): string {
  if (!oldVal && !newVal) return "--";
  if (!oldVal) return `Set to ${JSON.stringify(newVal)}`;
  if (!newVal) return `Removed ${JSON.stringify(oldVal)}`;
  return `${JSON.stringify(oldVal)} -> ${JSON.stringify(newVal)}`;
}
