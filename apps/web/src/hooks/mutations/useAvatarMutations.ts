"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamRepository } from "@/lib/api/repositories";
import { toast } from "sonner";

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, file }: { profileId: string; file: File }) =>
      teamRepository.uploadAvatar(profileId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "profiles"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Avatar uploaded");
    },
    onError: (error: Error) => {
      toast.error("Failed to upload avatar: " + error.message);
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) =>
      teamRepository.deleteAvatar(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "profiles"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Avatar removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove avatar: " + error.message);
    },
  });
}
