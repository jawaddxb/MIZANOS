"use client";

import { useState, useCallback } from "react";
import { Github, Check, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";

interface GitHubRepoPickerProps {
  value: string;
  onChange: (repo: string) => void;
  className?: string;
}

const REPO_PATTERN = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
const GITHUB_URL_PATTERN = /^https?:\/\/github\.com\/([a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+)/;

function extractRepo(input: string): string {
  const urlMatch = input.match(GITHUB_URL_PATTERN);
  if (urlMatch) return urlMatch[1];
  return input.trim();
}

function isValidRepo(input: string): boolean {
  if (!input) return false;
  const repo = extractRepo(input);
  return REPO_PATTERN.test(repo);
}

function GitHubRepoPicker({ value, onChange, className }: GitHubRepoPickerProps) {
  const [touched, setTouched] = useState(false);
  const valid = isValidRepo(value);
  const showError = touched && value.length > 0 && !valid;
  const showSuccess = value.length > 0 && valid;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => setTouched(true), []);

  const parsedRepo = value ? extractRepo(value) : "";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative">
        <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <BaseInput
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="owner/repo or GitHub URL"
          className={cn(
            "pl-9 pr-9",
            showError && "border-destructive focus-visible:ring-destructive",
            showSuccess && "border-green-500 focus-visible:ring-green-500"
          )}
        />
        {showSuccess && (
          <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
        )}
        {showError && (
          <AlertCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
        )}
      </div>
      {showError && (
        <p className="text-xs text-destructive">
          Enter a valid GitHub repository (owner/repo) or URL
        </p>
      )}
      {showSuccess && parsedRepo !== value && (
        <p className="text-xs text-muted-foreground">
          Detected: {parsedRepo}
        </p>
      )}
    </div>
  );
}

export { GitHubRepoPicker };
export type { GitHubRepoPickerProps };
