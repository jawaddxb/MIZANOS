"use client";

import * as React from "react";

import { Github, Loader2, AlertCircle, X } from "lucide-react";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { Button } from "@/components/molecules/buttons/Button";
import { PatSelector } from "@/components/molecules/github/PatSelector";
import { githubRepository } from "@/lib/api/repositories";
import type { GitHubData } from "./types";

interface GitHubRepoInputProps {
  githubData: GitHubData | null;
  onGitHubDataChange: (data: GitHubData | null) => void;
}

const GITHUB_URL_REGEX = /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/;

export function GitHubRepoInput({ githubData, onGitHubDataChange }: GitHubRepoInputProps) {
  const [repoUrl, setRepoUrl] = React.useState("");
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [selectedPatId, setSelectedPatId] = React.useState<string | null>(null);
  const [rawToken, setRawToken] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasAuth = !!selectedPatId || !!rawToken;

  const handleScan = React.useCallback(async () => {
    if (!GITHUB_URL_REGEX.test(repoUrl)) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }
    if (isPrivate && !hasAuth) {
      setError("Please select a PAT or add a token for private repositories");
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      const token = isPrivate ? (rawToken ?? undefined) : undefined;
      const patId = isPrivate ? (selectedPatId ?? undefined) : undefined;

      const repo = await githubRepository.getRepoInfo(repoUrl, token, patId);

      if (!repo.name && !repo.full_name) {
        setError(
          isPrivate
            ? "Could not access repository. Please check the URL and your token permissions."
            : "Repository not found. If it's private, check the private repository option and provide a token.",
        );
        return;
      }

      const data: GitHubData = {
        repositoryUrl: repoUrl,
        githubToken: isPrivate ? (rawToken ?? null) : null,
        patId: isPrivate ? (selectedPatId ?? null) : null,
        repoInfo: {
          name: repo.name ?? "",
          fullName: repo.full_name ?? "",
          description: repo.description ?? "",
          stars: repo.stars ?? 0,
          forks: repo.forks ?? 0,
          isPrivate,
        },
        techStack: {},
        branch: repo.default_branch ?? "main",
      };

      onGitHubDataChange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze repository");
    } finally {
      setIsScanning(false);
    }
  }, [repoUrl, isPrivate, rawToken, selectedPatId, hasAuth, onGitHubDataChange]);

  const handleClear = React.useCallback(() => {
    setRepoUrl("");
    setSelectedPatId(null);
    setRawToken(null);
    setIsPrivate(false);
    setError(null);
    onGitHubDataChange(null);
  }, [onGitHubDataChange]);

  const handlePatSelect = React.useCallback((patId: string | null) => {
    setSelectedPatId(patId);
    setRawToken(null);
    setError(null);
  }, []);

  const handleUseRawToken = React.useCallback((token: string) => {
    setRawToken(token);
    setSelectedPatId(null);
    setError(null);
  }, []);

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
          <BaseLabel>GitHub Token</BaseLabel>
          <PatSelector
            selectedPatId={selectedPatId}
            rawTokenActive={!!rawToken}
            onPatSelect={handlePatSelect}
            onUseRawToken={handleUseRawToken}
          />
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
