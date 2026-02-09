"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationsRepository } from "@/lib/api/repositories";
import type { Notification } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export function useNotifications() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: (): Promise<Notification[]> => notificationsRepository.getAll(),
    enabled: !!user?.id,
  });

  const unreadCount = query.data?.filter((n) => !n.read).length ?? 0;

  return {
    ...query,
    unreadCount,
  };
}
