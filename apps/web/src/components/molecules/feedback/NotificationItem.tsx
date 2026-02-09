"use client";

import { cn } from "@/lib/utils/cn";

interface NotificationItemProps {
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  onClick?: () => void;
  className?: string;
}

function NotificationItem({
  title,
  message,
  timestamp,
  read = false,
  onClick,
  className,
}: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent",
        !read && "bg-accent/50",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-sm", !read && "font-semibold")}>
          {title}
        </span>
        {!read && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{message}</p>
      <time className="text-[10px] text-muted-foreground/70">{timestamp}</time>
    </button>
  );
}

export { NotificationItem };
export type { NotificationItemProps };
