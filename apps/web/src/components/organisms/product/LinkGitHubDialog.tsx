"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { SearchableSelect } from "@/components/molecules/forms/SearchableSelect";
import { PatSelector } from "@/components/molecules/github/PatSelector";
import { useUpdateProduct } from "@/hooks/mutations/useProductMutations";
import { githubRepository } from "@/lib/api/repositories/github.repository";
import { Github, Loader2, GitBranch, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface LinkGitHubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  currentUrl?: string | null;
  currentPatId?: string | null;
  currentBranch?: string | null;
}

interface BranchItem { name: string; is_default: boolean }

export function LinkGitHubDialog({
  open, onOpenChange, productId, currentUrl, currentPatId, currentBranch,
}: LinkGitHubDialogProps) {
  const [repoUrl, setRepoUrl] = useState(currentUrl ?? "");
  const [branch, setBranch] = useState(currentBranch ?? "");
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedPatId, setSelectedPatId] = useState<string | null>(currentPatId ?? null);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const updateProduct = useUpdateProduct();
  const verifyIdRef = useRef(0);

  useEffect(() => {
    if (open) {
      setRepoUrl(currentUrl ?? "");
      setBranch(currentBranch ?? "");
      setIsPrivate(true);
      setSelectedPatId(currentPatId ?? null);
      setVerified(!!currentUrl);
      setVerifyError(null);
      setBranches([]);
      setLoadingBranches(false);
    }
  }, [open, currentUrl, currentPatId, currentBranch]);

  const resetVerification = useCallback(() => {
    setVerified(false);
    setVerifyError(null);
    setBranches([]);
    setBranch("");
  }, []);

  // Verify repo access + load branches in one go
  const verifyAndLoadBranches = useCallback(async (url: string, priv: boolean, patId: string | null) => {
    if (!url.trim()) return;
    if (priv && !patId) return;

    const id = ++verifyIdRef.current;
    const resolvedPatId = priv ? patId ?? undefined : undefined;

    setVerifying(true);
    setVerifyError(null);
    setVerified(false);
    setBranches([]);
    setBranch("");
    setLoadingBranches(true);

    try {
      // Step 1: Verify repo access
      const repo = await githubRepository.getRepoInfo(url.trim(), undefined, resolvedPatId);
      if (id !== verifyIdRef.current) return;
      if (!repo.name && !repo.full_name) {
        setVerifyError("Repository not accessible. Check the URL and PAT permissions.");
        setVerifying(false);
        setLoadingBranches(false);
        return;
      }

      setVerified(true);
      setVerifying(false);

      // Step 2: Load branches
      const branchList = await githubRepository.listBranches(url.trim(), resolvedPatId);
      if (id !== verifyIdRef.current) return;
      setBranches(branchList);
      const defaultBranch = branchList.find((b) => b.is_default);
      if (defaultBranch) setBranch(defaultBranch.name);
    } catch (err) {
      if (id !== verifyIdRef.current) return;
      console.error("[LinkGitHub] Verification failed:", err);
      setVerified(false);
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        setVerifyError("Session expired. Please refresh the page and try again.");
      } else if (priv && !patId) {
        setVerifyError("Repository not accessible. Select a PAT with access to this repository.");
      } else {
        setVerifyError("Repository not accessible. Check the URL and PAT permissions.");
      }
    } finally {
      if (id === verifyIdRef.current) {
        setVerifying(false);
        setLoadingBranches(false);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = repoUrl.trim();
    if (!url || !verified) return;

    updateProduct.mutate(
      {
        id: productId,
        repository_url: url,
        github_pat_id: isPrivate ? selectedPatId : null,
        tracked_branch: branch.trim() || null,
        github_repo_status: "ok",
        github_repo_error: null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const handleUseRawToken = () => {
    toast.info("Please save the token first to link it to this project.");
  };

  const branchOptions = branches.map((b) => ({
    value: b.name,
    label: b.is_default ? `${b.name} (default)` : b.name,
  }));

  const canSubmit = verified && !verifying && !loadingBranches && !updateProduct.isPending && !!repoUrl.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            {currentUrl ? "Update Repository" : "Link GitHub Repository"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Repository URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Repository URL</label>
            <input
              value={repoUrl}
              onChange={(e) => { setRepoUrl(e.target.value); resetVerification(); }}
              onBlur={() => verifyAndLoadBranches(repoUrl, isPrivate, selectedPatId)}
              placeholder="https://github.com/owner/repo"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              type="url"
            />
          </div>

          {/* 2. Private repo + PAT */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => {
                const priv = e.target.checked;
                setIsPrivate(priv);
                if (!priv) setSelectedPatId(null);
                resetVerification();
                if (!priv) verifyAndLoadBranches(repoUrl, false, null);
              }}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Private repository</span>
          </label>

          {isPrivate && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">GitHub PAT</label>
              <PatSelector
                selectedPatId={selectedPatId}
                onPatSelect={(patId) => {
                  setSelectedPatId(patId);
                  resetVerification();
                  if (patId) verifyAndLoadBranches(repoUrl, true, patId);
                }}
                onUseRawToken={handleUseRawToken}
              />
              <p className="text-xs text-muted-foreground">
                Select or add a PAT with read access to the repository.
              </p>
            </div>
          )}

          {/* Verification status */}
          {verifying && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying repository access...
            </p>
          )}
          {verifyError && <p className="text-sm text-destructive">{verifyError}</p>}
          {verified && !verifying && (
            <p className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Repository verified
            </p>
          )}

          {/* 3. Tracked Branch (dropdown) — only after verification */}
          {verified && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                Tracked Branch
                {loadingBranches && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </label>
              <SearchableSelect
                options={branchOptions}
                value={branch}
                onValueChange={setBranch}
                placeholder={loadingBranches ? "Loading branches..." : "Select a branch..."}
                emptyLabel={loadingBranches ? "Loading..." : "No branches found."}
              />
              <p className="text-xs text-muted-foreground">
                Only commits pushed to this branch will be tracked for task completion.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {updateProduct.isPending ? "Saving..." : currentUrl ? "Update" : "Link Repository"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
