"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { githubRepository } from "@/lib/api/repositories";

export function useConnectGitHub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // The backend returns an OAuth URL to redirect to
      const connections = await githubRepository.getConnections();
      return connections;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-connections"] });
      toast.success("GitHub connected");
    },
    onError: (error: Error) => {
      toast.error("Failed to connect GitHub: " + error.message);
    },
  });
}

export function useDisconnectGitHub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      githubRepository.disconnect(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-connections"] });
      toast.success("GitHub disconnected");
    },
    onError: (error: Error) => {
      toast.error("Failed to disconnect GitHub: " + error.message);
    },
  });
}
