"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/atoms/layout/Popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/atoms/display/Avatar";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { Button } from "@/components/molecules/buttons/Button";
import { ChevronDown, Loader2, CheckCircle2, Plus } from "lucide-react";
import { useGitHubPats } from "@/hooks/queries/useGitHubPats";
import { useVerifyPat, useCreatePat } from "@/hooks/mutations/useGitHubPatMutations";
import type { GitHubPat, GitHubPatVerifyResult } from "@/lib/types";

interface PatSelectorProps {
  selectedPatId: string | null;
  onPatSelect: (patId: string | null) => void;
  onUseRawToken: (token: string) => void;
}

function PatListItem({
  pat,
  isSelected,
  onSelect,
}: {
  pat: GitHubPat;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <Avatar className="h-6 w-6">
        {pat.github_avatar_url ? (
          <AvatarImage src={pat.github_avatar_url} alt={pat.github_username} />
        ) : null}
        <AvatarFallback className="text-xs">
          {pat.github_username[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{pat.label}</p>
        <p className="truncate text-xs text-muted-foreground">@{pat.github_username}</p>
      </div>
      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
    </button>
  );
}

export function PatSelector({ selectedPatId, onPatSelect, onUseRawToken }: PatSelectorProps) {
  const [open, setOpen] = useState(false);
  const [mineOnly, setMineOnly] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [rawToken, setRawToken] = useState("");
  const [label, setLabel] = useState("");
  const [verifyResult, setVerifyResult] = useState<GitHubPatVerifyResult | null>(null);

  const { data: pats = [] } = useGitHubPats(mineOnly);
  const { data: allPats = [] } = useGitHubPats(false);
  const verifyPat = useVerifyPat();
  const createPat = useCreatePat();

  const selectedPat = allPats.find((p) => p.id === selectedPatId);

  const handleVerify = async () => {
    const result = await verifyPat.mutateAsync(rawToken);
    setVerifyResult(result);
  };

  const handleUseOnce = () => {
    onUseRawToken(rawToken);
    resetAddState();
    setOpen(false);
  };

  const handleSaveAndUse = async () => {
    if (!label.trim()) return;
    const pat = await createPat.mutateAsync({ label: label.trim(), token: rawToken });
    onPatSelect(pat.id);
    resetAddState();
    setOpen(false);
  };

  const resetAddState = () => {
    setShowAdd(false);
    setRawToken("");
    setLabel("");
    setVerifyResult(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selectedPat ? (
            <span className="flex items-center gap-2 min-w-0">
              <Avatar className="h-5 w-5">
                {selectedPat.github_avatar_url ? (
                  <AvatarImage src={selectedPat.github_avatar_url} alt={selectedPat.github_username} />
                ) : null}
                <AvatarFallback className="text-[10px]">
                  {selectedPat.github_username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">
                {selectedPat.label} (@{selectedPat.github_username})
              </span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Select a GitHub PAT...</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setMineOnly(true)}
            className={`flex-1 px-3 py-2 text-xs font-medium ${
              mineOnly ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
            }`}
          >
            My PATs
          </button>
          <button
            type="button"
            onClick={() => setMineOnly(false)}
            className={`flex-1 px-3 py-2 text-xs font-medium ${
              !mineOnly ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
            }`}
          >
            All PATs
          </button>
        </div>

        <div className="max-h-48 overflow-y-auto p-2">
          {pats.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No PATs found</p>
          ) : (
            <div className="space-y-1">
              {pats.map((pat) => (
                <PatListItem
                  key={pat.id}
                  pat={pat}
                  isSelected={pat.id === selectedPatId}
                  onSelect={() => {
                    onPatSelect(pat.id);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-2">
          {!showAdd ? (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
              Add new token
            </button>
          ) : (
            <div className="space-y-2 p-1">
              <BaseInput
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={rawToken}
                onChange={(e) => {
                  setRawToken(e.target.value);
                  setVerifyResult(null);
                }}
                className="text-sm"
              />
              {!verifyResult?.valid && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleVerify}
                  disabled={!rawToken || verifyPat.isPending}
                >
                  {verifyPat.isPending ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : null}
                  Verify
                </Button>
              )}
              {verifyResult && !verifyResult.valid && (
                <p className="text-xs text-destructive">Invalid or expired token</p>
              )}
              {verifyResult?.valid && (
                <>
                  <div className="flex items-center gap-2 rounded-md bg-secondary/50 p-2">
                    <Avatar className="h-6 w-6">
                      {verifyResult.github_avatar_url ? (
                        <AvatarImage src={verifyResult.github_avatar_url} alt="" />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {verifyResult.github_username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">@{verifyResult.github_username}</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={handleUseOnce}>
                    Use Once
                  </Button>
                  <div className="flex gap-2">
                    <BaseInput
                      placeholder="Label"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="text-sm flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveAndUse}
                      disabled={!label.trim() || createPat.isPending}
                    >
                      {createPat.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
