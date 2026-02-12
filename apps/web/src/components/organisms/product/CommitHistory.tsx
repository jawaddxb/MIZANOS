"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/atoms/display/Avatar";
import { Button } from "@/components/molecules/buttons/Button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { githubRepository } from "@/lib/api/repositories";
import { toast } from "sonner";
import type { RepoScanHistory } from "@/lib/types";
import { GitCommitHorizontal, GitBranch, Github, RefreshCw, Loader2 } from "lucide-react";

interface CommitHistoryProps {
  productId: string;
  repositoryUrl?: string | null;
  onLinkGitHub?: () => void;
}

interface CommitData {
  sha: string;
  fullSha: string;
  message: string;
  author: string;
  authorLogin?: string;
  authorAvatar?: string;
  date: string;
}

function parseScanToCommits(scans: RepoScanHistory[]): CommitData[] {
  return scans.map((scan) => ({
    sha: scan.latest_commit_sha.slice(0, 7),
    fullSha: scan.latest_commit_sha,
    message: scan.diff_summary ?? `${scan.files_changed} files changed`,
    author: "Unknown",
    date: scan.created_at,
  }));
}

function CommitRow({ commit }: { commit: CommitData }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-card border text-sm">
      <Avatar className="h-7 w-7 shrink-0">
        {commit.authorAvatar && <AvatarImage src={commit.authorAvatar} />}
        <AvatarFallback className="text-xs">
          {commit.author.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono text-xs tabular-nums">
            {commit.sha}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(commit.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <p className="text-sm truncate mt-1">{commit.message}</p>
        <p className="text-xs text-muted-foreground">
          {commit.author}
          {commit.authorLogin &&
            commit.authorLogin !== commit.author && (
              <span> (@{commit.authorLogin})</span>
            )}
        </p>
      </div>
    </div>
  );
}

function CommitHistory({ productId, repositoryUrl, onLinkGitHub }: CommitHistoryProps) {
  const queryClient = useQueryClient();
  const { data: scanHistory, isLoading } = useQuery({
    queryKey: ["github-scans", productId],
    queryFn: (): Promise<RepoScanHistory[]> =>
      githubRepository.getScanHistory(productId),
    enabled: !!productId,
  });

  const triggerScan = useMutation({
    mutationFn: () => githubRepository.triggerScan(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-scans", productId] });
      toast.success("Repository scan triggered");
    },
    onError: (error: Error) => toast.error("Scan failed: " + error.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  const commits = scanHistory ? parseScanToCommits(scanHistory) : [];

  if (commits.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <GitCommitHorizontal className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Commit History
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {repositoryUrl
              ? "No repository scans recorded yet. Scans run daily to track changes."
              : "Link a GitHub repository to start tracking commit history."}
          </p>
          {repositoryUrl ? (
            <Button
              onClick={() => triggerScan.mutate()}
              disabled={triggerScan.isPending}
            >
              {triggerScan.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Scan Now
            </Button>
          ) : onLinkGitHub ? (
            <Button onClick={onLinkGitHub}>
              <Github className="h-4 w-4 mr-2" />
              Link GitHub Repository
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const totalFilesChanged = scanHistory?.reduce(
    (sum, scan) => sum + scan.files_changed,
    0,
  ) ?? 0;
  const totalAdded = scanHistory?.reduce(
    (sum, scan) => sum + scan.lines_added,
    0,
  ) ?? 0;
  const totalRemoved = scanHistory?.reduce(
    (sum, scan) => sum + scan.lines_removed,
    0,
  ) ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums">
              {commits.length}
            </p>
            <p className="text-xs text-muted-foreground">Total Scans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-green-600 dark:text-green-400">
              +{totalAdded.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Lines Added</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
              -{totalRemoved.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Lines Removed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitCommitHorizontal className="h-4 w-4" />
            Recent Scans ({commits.length})
            {repositoryUrl && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => triggerScan.mutate()}
                disabled={triggerScan.isPending}
              >
                {triggerScan.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Scan Now
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {commits.map((commit) => (
              <CommitRow key={commit.fullSha} commit={commit} />
            ))}
          </div>
        </CardContent>
      </Card>

      {repositoryUrl && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitBranch className="h-4 w-4" />
          <span>
            Repository:{" "}
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              {repositoryUrl.replace("https://github.com/", "")}
            </a>
          </span>
        </div>
      )}
    </div>
  );
}

export { CommitHistory };
export type { CommitHistoryProps };
