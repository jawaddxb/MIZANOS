"use client";

import { useMemo } from "react";
import { Users, UserCheck, Clock, UserX } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Profile } from "@/lib/types/user";

interface TeamCapacityOverviewProps {
  profiles: Profile[];
}

export function TeamCapacityOverview({ profiles }: TeamCapacityOverviewProps) {
  const stats = useMemo(() => {
    const available = profiles.filter((p) => p.availability === "available").length;
    const busy = profiles.filter((p) => p.availability === "busy").length;
    const unavailable = profiles.filter((p) => p.availability === "unavailable").length;

    const totalCapacity = profiles.reduce((sum, p) => sum + (p.max_projects ?? 3), 0);
    const usedCapacity = profiles.reduce((sum, p) => sum + (p.current_projects ?? 0), 0);
    const avgUtilization = totalCapacity > 0
      ? Math.round((usedCapacity / totalCapacity) * 100)
      : 0;

    return { available, busy, unavailable, totalCapacity, usedCapacity, avgUtilization };
  }, [profiles]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <StatChip icon={Users} label="Total Members" value={profiles.length} color="text-foreground" />
      <StatChip icon={UserCheck} label="Available" value={stats.available} color="text-status-healthy" />
      <StatChip icon={Clock} label="Busy" value={stats.busy} color="text-status-warning" />
      <StatChip icon={UserX} label="Unavailable" value={stats.unavailable} color="text-status-critical" />
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm">
        <span className="text-muted-foreground">Utilization</span>
        <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              stats.avgUtilization >= 90
                ? "bg-status-critical"
                : stats.avgUtilization >= 70
                  ? "bg-status-warning"
                  : "bg-status-healthy",
            )}
            style={{ width: `${Math.min(100, stats.avgUtilization)}%` }}
          />
        </div>
        <span className="font-medium">{stats.avgUtilization}%</span>
        <span className="text-muted-foreground text-xs">
          ({stats.usedCapacity}/{stats.totalCapacity})
        </span>
      </div>
    </div>
  );
}

interface StatChipProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}

function StatChip({ icon: Icon, label, value, color }: StatChipProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm">
      <Icon className={cn("h-3.5 w-3.5", color)} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
