"use client";

import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Rocket,
  TrendingUp,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDashboardMetrics } from "@/hooks/queries/useDashboardMetrics";

interface QuickStatsProps {
  totalProducts?: number;
  inProgressCount?: number;
  healthyCount?: number;
  warningCount?: number;
  criticalCount?: number;
  deploymentStageCount?: number;
}

interface StatItemProps {
  label: string;
  value: number;
  suffix?: string;
  subtitle?: string;
  Icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  accent?: "success" | "warning" | "critical";
}

function StatItem({ label, value, suffix, subtitle, Icon, iconColor, iconBg, accent }: StatItemProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden bg-card rounded-xl border p-4",
        "transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5",
        accent === "warning" && "border-status-warning/30 hover:border-status-warning/50",
        accent === "critical" && "border-status-critical/30 hover:border-status-critical/50",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          accent === "warning" && "bg-gradient-to-br from-status-warning/5 to-transparent",
          accent === "critical" && "bg-gradient-to-br from-status-critical/5 to-transparent",
          !accent && "bg-gradient-to-br from-secondary/50 to-transparent",
        )}
      />
      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
            iconBg,
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold font-mono text-foreground tabular-nums">{value}</p>
            {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
          </div>
          <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
          {subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function QuickStats(props: QuickStatsProps) {
  const { data: metrics, isLoading } = useDashboardMetrics();

  const stageDistribution = metrics?.stageDistribution ?? [];
  const totalProducts = props.totalProducts ?? stageDistribution.reduce((sum, s) => sum + s.count, 0);
  const deploymentStageCount = props.deploymentStageCount ?? (stageDistribution.find((s) => s.stage === "Deployment")?.count ?? 0);
  const healthyCount = props.healthyCount ?? (stageDistribution.find((s) => s.stage === "Complete")?.count ?? 0);
  const warningCount = props.warningCount ?? (metrics?.overdueTasks.length ?? 0);
  const criticalCount = props.criticalCount ?? (metrics?.failedQAChecks.length ?? 0);
  const inProgressCount = props.inProgressCount ?? (stageDistribution.find((s) => s.stage === "Development")?.count ?? 0);

  const hasAllProps = props.totalProducts !== undefined;
  if (isLoading && !hasAllProps) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatItem label="Total Projects" value={totalProducts} subtitle={`${inProgressCount} active`} Icon={FolderKanban} iconColor="text-foreground" iconBg="bg-secondary" />
      <StatItem label="Healthy" value={healthyCount} Icon={CheckCircle2} iconColor="text-status-healthy" iconBg="bg-status-healthy/10" accent="success" />
      <StatItem label="Needs Attention" value={warningCount} Icon={Clock} iconColor="text-status-warning" iconBg="bg-status-warning/10" accent="warning" />
      <StatItem label="At Risk" value={criticalCount} Icon={AlertTriangle} iconColor="text-status-critical" iconBg="bg-status-critical/10" accent="critical" />
      <StatItem label="In Pipeline" value={deploymentStageCount} Icon={Rocket} iconColor="text-pillar-business" iconBg="bg-pillar-business/10" />
      <StatItem label="Health Rate" value={totalProducts > 0 ? Math.round((healthyCount / totalProducts) * 100) : 0} suffix="%" Icon={TrendingUp} iconColor="text-pillar-development" iconBg="bg-pillar-development/10" />
    </div>
  );
}
