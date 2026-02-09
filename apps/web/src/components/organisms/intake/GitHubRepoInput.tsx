"use client";

import * as React from "react";

import { Github, Loader2, AlertCircle, X } from "lucide-react";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { Button } from "@/components/molecules/buttons/Button";
import { githubRepository } from "@/lib/api/repositories";
import type { GitHubData } from "./types";

interface GitHubRepoInputProps {
  githubData: GitHubData | null;
  onGitHubDataChange: (data: GitHubData | null) => void;
}

const GITHUB_URL_REGEX = /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/;

function extractRepoPath(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, "");
}

export function GitHubRepoInput({ githubData, onGitHubDataChange }: GitHubRepoInputProps) {
  const [repoUrl, setRepoUrl] = React.useState("");
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [githubToken, setGithubToken] = React.useState("");
  const [isScanning, setIsScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleScan = React.useCallback(async () => {
    if (!GITHUB_URL_REGEX.test(repoUrl)) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }
    if (isPrivate && !githubToken) {
      setError("GitHub token is required for private repositories");
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      const info = await githubRepository.getRepoInfo(
        repoUrl,
        isPrivate ? githubToken : undefined,
      );
      const repo = info.repository;

      const data: GitHubData = {
        repositoryUrl: repoUrl,
        githubToken: isPrivate ? githubToken : null,
        repoInfo: {
          name: repo.name ?? "",
          fullName: repo.fullName ?? "",
          description: "",
          stars: 0,
          forks: repo.forksCount ?? 0,
          isPrivate: repo.isPrivate ?? false,
        },
        techStack: {},
        branch: repo.defaultBranch ?? "main",
      };

      onGitHubDataChange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze repository");
    } finally {
      setIsScanning(false);
    }
  }, [repoUrl, isPrivate, githubToken, onGitHubDataChange]);

  const handleClear = React.useCallback(() => {
    setRepoUrl("");
    setGithubToken("");
    setIsPrivate(false);
    setError(null);
    onGitHubDataChange(null);
  }, [onGitHubDataChange]);

  if (githubData) {
    const info = githubData.repoInfo;
    return (
      <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <Github className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {(info.fullName as string) || githubData.repositoryUrl}
            </p>
            {info.description && (
              <p className="truncate text-xs text-muted-foreground">
                {info.description as string}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Branch: {githubData.branch}
              {info.stars !== undefined && <> &middot; {info.stars as number} stars</>}
              {info.forks !== undefined && <> &middot; {info.forks as number} forks</>}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <BaseLabel htmlFor="repo-url" className="flex items-center gap-2">
          <Github className="h-4 w-4" />
          Repository URL
        </BaseLabel>
        <div className="flex gap-2">
          <BaseInput
            id="repo-url"
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={(e) => { setRepoUrl(e.target.value); setError(null); }}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && !isScanning && handleScan()}
          />
          <Button onClick={handleScan} disabled={!repoUrl || isScanning}>
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              "Scan"
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <BaseCheckbox
          id="private-repo"
          checked={isPrivate}
          onCheckedChange={(checked) => setIsPrivate(checked === true)}
        />
        <BaseLabel htmlFor="private-repo" className="text-sm text-muted-foreground">
          Private repository (requires GitHub token)
        </BaseLabel>
      </div>

      {isPrivate && (
        <div className="space-y-2">
          <BaseLabel htmlFor="github-token">GitHub Token</BaseLabel>
          <BaseInput
            id="github-token"
            type="password"
            placeholder="ghp_xxxxxxxxxxxx"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Create a token at GitHub Settings &gt; Developer Settings &gt; Personal Access Tokens
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
