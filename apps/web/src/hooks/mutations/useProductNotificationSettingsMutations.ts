"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import { toast } from "sonner";

export function useUpdateProductNotificationSettings(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emailEnabled: boolean) =>
      productsRepository.updateNotificationSettings(productId, emailEnabled),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["product-notification-settings", productId],
      });
      toast.success(
        data.email_enabled
          ? "Email notifications enabled"
          : "Email notifications disabled",
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to update notification settings: " + error.message);
    },
  });
}
