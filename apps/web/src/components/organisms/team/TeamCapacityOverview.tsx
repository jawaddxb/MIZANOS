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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={Users}
        label="Total Members"
        value={profiles.length}
        color="text-foreground"
      />
      <StatCard
        icon={UserCheck}
        label="Available"
        value={stats.available}
        color="text-status-healthy"
      />
      <StatCard
        icon={Clock}
        label="Busy"
        value={stats.busy}
        color="text-status-warning"
      />
      <StatCard
        icon={UserX}
        label="Unavailable"
        value={stats.unavailable}
        color="text-status-critical"
      />
      <div className="col-span-2 md:col-span-4 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Team Utilization</span>
          <span className="text-sm text-muted-foreground">
            {stats.usedCapacity}/{stats.totalCapacity} project slots ({stats.avgUtilization}%)
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
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
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
      <Icon className={cn("h-5 w-5", color)} />
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
