import { useQuery } from "@tanstack/react-query";
import { GitHubPatsRepository } from "@/lib/api/repositories/github-pats.repository";

export const GITHUB_PATS_KEY = "github-pats";

const getRepo = () => new GitHubPatsRepository();

export function useGitHubPats(mineOnly = false) {
  return useQuery({
    queryKey: [GITHUB_PATS_KEY, { mineOnly }],
    queryFn: () => getRepo().getAll(mineOnly),
  });
}
