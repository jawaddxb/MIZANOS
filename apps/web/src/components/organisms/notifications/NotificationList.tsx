"use client";

import { useState, useMemo, useCallback } from "react";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { NotificationItem } from "@/components/molecules/feedback/NotificationItem";
import type { Notification } from "@/lib/types";
import type { NotificationType } from "@/lib/types/enums";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { useNotificationMutations } from "@/hooks/mutations/useNotificationMutations";
import { formatDistanceToNow } from "date-fns";

interface NotificationListProps {
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
}

type FilterMode = "all" | "unread";

const TYPE_LABELS: Record<NotificationType, string> = {
  task_assigned: "Task Assigned",
  product_status_changed: "Status Changed",
  qa_check_failed: "QA Failed",
  specification_ready: "Spec Ready",
  stage_changed: "Stage Changed",
  repo_scan_completed: "Repo Scan",
};

export function NotificationList({
  className,
  onNotificationClick,
}: NotificationListProps) {
  const { data: notifications, isLoading } = useNotifications();
  const { markAsRead, markAllAsRead } = useNotificationMutations();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");

  const filtered = useMemo(() => {
    if (!notifications) return [];
    return notifications.filter((n: Notification) => {
      if (filter === "unread" && n.read) return false;
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, filter, typeFilter]);

  const unreadCount = useMemo(
    () => notifications?.filter((n: Notification) => !n.read).length ?? 0,
    [notifications],
  );

  const notificationTypes = useMemo(() => {
    if (!notifications) return [];
    return [...new Set(notifications.map((n: Notification) => n.type))];
  }, [notifications]);

  const handleItemClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead.mutate(notification.id);
      }
      onNotificationClick?.(notification);
    },
    [markAsRead, onNotificationClick],
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} unread</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("unread")}
              >
                Unread
              </Button>
            </div>
            {notificationTypes.length > 1 && (
              <>
                <div className="h-4 w-px bg-border mx-1" />
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as NotificationType | "all")
                  }
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="all">All types</option>
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type] ?? type}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="px-6 pb-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {filter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  title={notification.title}
                  message={notification.message ?? ""}
                  timestamp={formatDistanceToNow(
                    new Date(notification.created_at),
                    { addSuffix: true },
                  )}
                  read={notification.read}
                  onClick={() => handleItemClick(notification)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
