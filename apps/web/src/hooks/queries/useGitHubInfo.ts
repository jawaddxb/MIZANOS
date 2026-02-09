"use client";

import { useQuery } from "@tanstack/react-query";
import { githubRepository } from "@/lib/api/repositories";
import type { GitHubInfo } from "@/lib/types";

export function useGitHubInfo(
  repositoryUrl: string | null | undefined,
  githubToken?: string,
) {
  return useQuery({
    queryKey: ["github-info", repositoryUrl],
    queryFn: (): Promise<GitHubInfo> =>
      githubRepository.getRepoInfo(repositoryUrl!, githubToken),
    enabled: !!repositoryUrl && repositoryUrl.includes("github.com"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
