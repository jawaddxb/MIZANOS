import { useQuery } from "@tanstack/react-query";
import { repoEvaluatorRepository } from "@/lib/api/repositories/repo-evaluator.repository";
import type { BrowseResponse } from "@/lib/types/repo-evaluator";

export function useDirectoryBrowser(path?: string, enabled = true) {
  return useQuery<BrowseResponse>({
    queryKey: ["directory-browser", path ?? "~"],
    queryFn: () => repoEvaluatorRepository.browse(path),
    enabled,
  });
}
