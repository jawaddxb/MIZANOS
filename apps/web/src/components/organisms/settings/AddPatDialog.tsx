"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/atoms/display/Avatar";
import { Button } from "@/components/molecules/buttons/Button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useVerifyPat, useCreatePat } from "@/hooks/mutations/useGitHubPatMutations";
import type { GitHubPatVerifyResult } from "@/lib/types";

interface AddPatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPatDialog({ open, onOpenChange }: AddPatDialogProps) {
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("");
  const [verifyResult, setVerifyResult] = useState<GitHubPatVerifyResult | null>(null);

  const verifyPat = useVerifyPat();
  const createPat = useCreatePat();

  const handleVerify = async () => {
    const result = await verifyPat.mutateAsync(token);
    setVerifyResult(result);
  };

  const handleSave = async () => {
    if (!verifyResult?.valid || !label.trim()) return;
    await createPat.mutateAsync({ label: label.trim(), token });
    handleClose();
  };

  const handleClose = () => {
    setToken("");
    setLabel("");
    setVerifyResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add GitHub PAT</DialogTitle>
          <DialogDescription>
            Paste a GitHub Personal Access Token to verify and save it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <BaseLabel htmlFor="pat-token">GitHub Token</BaseLabel>
            <div className="flex gap-2">
              <BaseInput
                id="pat-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setVerifyResult(null);
                }}
                className="flex-1"
                disabled={verifyResult?.valid}
              />
              {!verifyResult?.valid && (
                <Button
                  onClick={handleVerify}
                  disabled={!token || verifyPat.isPending}
                >
                  {verifyPat.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              )}
            </div>
          </div>

          {verifyResult && !verifyResult.valid && (
            <p className="text-sm text-destructive">
              Token is invalid or expired. Please check and try again.
            </p>
          )}

          {verifyResult?.valid && (
            <>
              <div className="flex items-center gap-3 rounded-lg border bg-secondary/30 p-3">
                <Avatar className="h-10 w-10">
                  {verifyResult.github_avatar_url ? (
                    <AvatarImage
                      src={verifyResult.github_avatar_url}
                      alt={verifyResult.github_username ?? ""}
                    />
                  ) : null}
                  <AvatarFallback>
                    {verifyResult.github_username?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    @{verifyResult.github_username}
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </p>
                  {verifyResult.scopes && (
                    <p className="text-xs text-muted-foreground">
                      Scopes: {verifyResult.scopes}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <BaseLabel htmlFor="pat-label">Label</BaseLabel>
                <BaseInput
                  id="pat-label"
                  placeholder='e.g. "My work PAT"'
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  autoFocus
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!verifyResult?.valid || !label.trim() || createPat.isPending}
          >
            {createPat.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
