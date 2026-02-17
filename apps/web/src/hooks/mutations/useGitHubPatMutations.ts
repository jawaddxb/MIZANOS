"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GitHubPatsRepository } from "@/lib/api/repositories/github-pats.repository";
import { GITHUB_PATS_KEY } from "@/hooks/queries/useGitHubPats";

const getRepo = () => new GitHubPatsRepository();

export function useVerifyPat() {
  return useMutation({
    mutationFn: (token: string) => getRepo().verify(token),
    onError: (error: Error) => {
      toast.error("Failed to verify token: " + error.message);
    },
  });
}

export function useCreatePat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { label: string; token: string }) =>
      getRepo().create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GITHUB_PATS_KEY] });
      toast.success("GitHub PAT saved");
    },
    onError: (error: Error) => {
      toast.error("Failed to save PAT: " + error.message);
    },
  });
}

export function useUpdatePat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { label?: string; is_active?: boolean };
    }) => getRepo().update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GITHUB_PATS_KEY] });
      toast.success("PAT updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update PAT: " + error.message);
    },
  });
}

export function useDeletePat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => getRepo().delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GITHUB_PATS_KEY] });
      toast.success("PAT deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete PAT: " + error.message);
    },
  });
}
