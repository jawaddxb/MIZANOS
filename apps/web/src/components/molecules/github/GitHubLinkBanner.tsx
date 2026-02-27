"use client";

import { CheckCircle2, AlertTriangle, Github, GitBranch } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";

interface GitHubLinkBannerProps {
  repositoryUrl: string | null;
  repoStatus: string | null;
  repoError: string | null;
  trackedBranch: string | null;
  onLinkClick: () => void;
}

export function GitHubLinkBanner({ repositoryUrl, repoStatus, repoError, trackedBranch, onLinkClick }: GitHubLinkBannerProps) {
  if (repositoryUrl && repoStatus === "error") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">GitHub Access Issue</p>
          <p className="text-xs text-amber-600">
            {repoError || "Cannot access the linked repository. Please update the PAT."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onLinkClick}
          className="text-amber-700 border-amber-300 hover:bg-amber-100"
        >
          Fix
        </Button>
      </div>
    );
  }

  if (repositoryUrl) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3 mb-4">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-800">GitHub Repository Linked</p>
          <div className="flex items-center gap-2 text-xs text-green-600">
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline truncate"
            >
              {repositoryUrl.replace("https://github.com/", "")}
            </a>
            {trackedBranch && (
              <span className="inline-flex items-center gap-0.5 shrink-0">
                <span className="text-green-400">·</span>
                <GitBranch className="h-3 w-3" />
                {trackedBranch}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onLinkClick}
          className="text-green-700 border-green-300 hover:bg-green-100"
        >
          Update
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 mb-4">
      <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">No GitHub Repository Linked</p>
        <p className="text-xs text-red-600">
          Link a repository and set a tracked branch to enable commit tracking, pull requests, and code analysis.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onLinkClick}
        className="text-red-700 border-red-300 hover:bg-red-100"
      >
        <Github className="h-4 w-4 mr-1" />
        Link GitHub
      </Button>
    </div>
  );
}
