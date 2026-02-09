"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsRepository } from "@/lib/api/repositories";
import { useAuth } from "@/contexts/AuthContext";

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) =>
      notificationsRepository.markAsRead([notificationId]),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.id],
      });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsRepository.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.id],
      });
    },
  });

  return { markAsRead, markAllAsRead };
}
