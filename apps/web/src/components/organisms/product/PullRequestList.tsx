"use client";

import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/atoms/display/Avatar";
import { Loader2, GitPullRequest } from "lucide-react";
import { useGitHubInfo } from "@/hooks/queries/useGitHubInfo";
import type { GitHubPullRequest, Product } from "@/lib/types";

interface PullRequestListProps {
  productId: string;
  repositoryUrl: string | null | undefined;
}

const STATE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "default",
  closed: "secondary",
  merged: "outline",
};

const STATE_LABEL: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  merged: "Merged",
};

function PullRequestRow({ pr }: { pr: GitHubPullRequest }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <GitPullRequest className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">#{pr.number}</span>
          <span className="text-sm truncate">{pr.title}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant={STATE_VARIANT[pr.state] ?? "outline"}
            className="text-[10px]"
          >
            {STATE_LABEL[pr.state] ?? pr.state}
          </Badge>
          <div className="flex items-center gap-1">
            {pr.authorAvatar && (
              <Avatar className="h-4 w-4">
                <AvatarImage src={pr.authorAvatar} />
                <AvatarFallback className="text-[8px]">
                  {pr.author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="text-xs text-muted-foreground">{pr.author}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(pr.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PullRequestList({
  repositoryUrl,
}: PullRequestListProps) {
  const { data: githubInfo, isLoading } = useGitHubInfo(repositoryUrl);
  const pullRequests = githubInfo?.pullRequests ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!repositoryUrl) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <GitPullRequest className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="font-medium">No repository connected</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add a repository URL to view pull requests
          </p>
        </CardContent>
      </Card>
    );
  }

  if (pullRequests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <GitPullRequest className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="font-medium">No pull requests</p>
          <p className="text-sm text-muted-foreground mt-1">
            No pull requests found for this repository
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold flex items-center gap-2">
        <GitPullRequest className="h-4 w-4" />
        Pull Requests ({pullRequests.length})
      </h3>
      <div className="space-y-2">
        {pullRequests.map((pr) => (
          <PullRequestRow key={pr.number} pr={pr} />
        ))}
      </div>
    </div>
  );
}
