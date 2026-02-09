"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import type { UserWithRole } from "@/lib/types";
import { toast } from "sonner";

export function useUsers() {
  return useQuery({
    queryKey: ["users-management"],
    queryFn: (): Promise<UserWithRole[]> => settingsRepository.getUsers(),
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      email: string;
      full_name: string;
      role: string;
      skills?: string[];
      availability?: string;
      max_projects?: number;
      office_location?: string;
    }) => settingsRepository.inviteUser(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      if (data.temp_password) {
        toast.info(`User invited. Temporary password: ${data.temp_password}`, {
          duration: 30000,
        });
      } else {
        toast.success("User invited successfully");
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to invite user: " + error.message);
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: (userId: string) =>
      settingsRepository.resetUserPassword(userId),
    onSuccess: (data) => {
      if (data.temp_password) {
        toast.info(
          `Password reset. New temporary password: ${data.temp_password}`,
          { duration: 30000 },
        );
      } else {
        toast.success("Password reset successfully");
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to reset password: " + error.message);
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      settingsRepository.updateUserStatus(userId, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      toast.success(
        `User ${status === "suspended" ? "suspended" : "activated"}`,
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });
}
