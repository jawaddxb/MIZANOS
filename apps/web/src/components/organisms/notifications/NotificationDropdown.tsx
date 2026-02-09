"use client";

import { useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { NotificationItem } from "@/components/molecules/feedback/NotificationItem";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/layout/Popover";
import type { Notification } from "@/lib/types";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { useNotificationMutations } from "@/hooks/mutations/useNotificationMutations";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface NotificationDropdownProps {
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationDropdown({
  className,
  onNotificationClick,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const { data: notifications, unreadCount, isLoading } = useNotifications();
  const { markAsRead, markAllAsRead } = useNotificationMutations();

  const handleItemClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead.mutate(notification.id);
      }
      onNotificationClick?.(notification);
      setOpen(false);
    },
    [markAsRead, onNotificationClick],
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2"
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea
          className={cn(
            notifications && notifications.length > 0 ? "h-80" : "h-auto",
          )}
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="p-1">
              {notifications.map((notification) => (
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
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
