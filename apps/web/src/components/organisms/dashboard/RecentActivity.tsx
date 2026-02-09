"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import {
  Activity,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboardMetrics } from "@/hooks/queries/useDashboardMetrics";
import { cn } from "@/lib/utils/cn";

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  task_assigned: {
    icon: <User className="h-3 w-3" />,
    color: "text-pillar-product",
    bg: "bg-pillar-product/10",
  },
  product_status_changed: {
    icon: <RefreshCw className="h-3 w-3" />,
    color: "text-pillar-business",
    bg: "bg-pillar-business/10",
  },
  qa_check_failed: {
    icon: <AlertTriangle className="h-3 w-3" />,
    color: "text-status-critical",
    bg: "bg-status-critical/10",
  },
  specification_ready: {
    icon: <FileText className="h-3 w-3" />,
    color: "text-pillar-development",
    bg: "bg-pillar-development/10",
  },
  stage_changed: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    color: "text-status-healthy",
    bg: "bg-status-healthy/10",
  },
};

const defaultConfig = {
  icon: <Bell className="h-3 w-3" />,
  color: "text-muted-foreground",
  bg: "bg-secondary",
};

export function RecentActivity() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading) return <LoadingSkeleton />;

  const activities = metrics?.recentActivity || [];

  return (
    <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-secondary flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[180px] pr-2">
            <div className="space-y-0.5">
              {activities.map((activity, index) => {
                const config = typeConfig[activity.type] || defaultConfig;
                return (
                  <Link
                    key={activity.id}
                    href={activity.product_id ? `/products/${activity.product_id}` : "#"}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                    style={{
                      opacity: 0,
                      animation: `fade-in 0.2s ease-out ${index * 40}ms forwards`,
                    }}
                  >
                    <div
                      className={cn(
                        "h-6 w-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
                        "transition-transform duration-200 group-hover:scale-110",
                        config.bg,
                        config.color,
                      )}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate leading-tight">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium">{activity.product_name}</span>
                        <span className="mx-1.5 opacity-50">&bull;</span>
                        <span className="font-mono text-[11px]">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="h-5 w-5 rounded-lg bg-muted animate-pulse" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 p-2 animate-pulse">
              <Skeleton className="h-6 w-6 rounded flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
