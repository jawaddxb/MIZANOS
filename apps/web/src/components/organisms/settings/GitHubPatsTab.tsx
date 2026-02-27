"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/atoms/display/Card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/atoms/display/Avatar";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Github, Plus, Trash2, Loader2, ExternalLink, Info, ChevronDown, RefreshCw, CircleCheck, CircleX } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/atoms/layout/Collapsible";
import { useGitHubPats } from "@/hooks/queries/useGitHubPats";
import { useUpdatePat, useDeletePat } from "@/hooks/mutations/useGitHubPatMutations";
import { GitHubPatsRepository } from "@/lib/api/repositories/github-pats.repository";
import { toast } from "sonner";
import type { GitHubPat } from "@/lib/types";

interface GitHubPatsTabProps {
  onAddPat: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PatCard({
  pat,
  onToggle,
  onDelete,
  onCheck,
  checking,
}: {
  pat: GitHubPat;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onCheck: (id: string) => void;
  checking: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-8 w-8">
          {pat.github_avatar_url ? (
            <AvatarImage src={pat.github_avatar_url} alt={pat.github_username} />
          ) : null}
          <AvatarFallback>{pat.github_username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{pat.label}</p>
            {pat.token_status === "valid" ? (
              <Badge variant="outline" className="text-xs shrink-0 border-green-300 text-green-700 bg-green-50">
                <CircleCheck className="h-3 w-3 mr-1" /> Valid
              </Badge>
            ) : pat.token_status === "expired" ? (
              <Badge variant="outline" className="text-xs shrink-0 border-red-300 text-red-700 bg-red-50">
                <CircleX className="h-3 w-3 mr-1" /> Expired
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            @{pat.github_username} &middot; Last used: {formatDate(pat.last_used_at)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onCheck(pat.id)} disabled={checking} title="Re-check PAT status">
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
        <BaseSwitch checked={pat.is_active} onCheckedChange={(checked) => onToggle(pat.id, checked)} />
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(pat.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function GitHubPatsTab({ onAddPat }: GitHubPatsTabProps) {
  const { data: pats = [], isLoading } = useGitHubPats();
  const queryClient = useQueryClient();
  const updatePat = useUpdatePat();
  const deletePat = useDeletePat();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const handleCheckStatus = useCallback(async (id: string) => {
    setCheckingId(id);
    try {
      const result = await new GitHubPatsRepository().checkStatus(id);
      if (result.valid) {
        toast.success("PAT is valid and active");
      } else {
        toast.error("PAT is expired or revoked on GitHub");
      }
      await queryClient.invalidateQueries({ queryKey: ["github-pats"] });
    } catch {
      toast.error("Failed to check PAT status");
    } finally {
      setCheckingId(null);
    }
  }, [queryClient]);

  const handleToggle = useCallback(
    (id: string, isActive: boolean) => {
      updatePat.mutate({ id, data: { is_active: isActive } });
    },
    [updatePat],
  );

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deletePat.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deletePat]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Collapsible defaultOpen>
        <div className="rounded-lg border border-blue-200 bg-blue-50/50">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">How to create a read-only GitHub PAT</span>
            </div>
            <ChevronDown className="h-4 w-4 text-blue-600 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0">
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>
                  Go to{" "}
                  <a
                    href="https://github.com/settings/personal-access-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium inline-flex items-center gap-0.5"
                  >
                    GitHub Token Settings
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}and click <strong>Generate new token</strong> (Fine-grained)
                </li>
                <li>Give it a name, set expiration to <strong>no expiration</strong> (or the maximum allowed), and select <strong>All repositories</strong></li>
                <li>Under <strong>Permissions &rarr; Repository permissions</strong>, set <strong>Contents</strong> to <strong>Read-only</strong></li>
                <li>Leave all other permissions as <strong>No access</strong></li>
                <li>Click <strong>Generate token</strong> and paste it here</li>
              </ol>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">GitHub Personal Access Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Manage saved GitHub PATs for scanning private repositories
              </p>
            </div>
            <Button onClick={onAddPat}>
              <Plus className="mr-2 h-4 w-4" />
              Add PAT
            </Button>
          </div>
        </div>
        <div className="px-6 pb-6">
          {pats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No GitHub PATs saved yet.</p>
              <p className="text-sm mt-1">
                Add a personal access token to scan private repositories.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pats.map((pat) => (
                <PatCard
                  key={pat.id}
                  pat={pat}
                  onToggle={handleToggle}
                  onDelete={(id) => setDeleteTarget(id)}
                  onCheck={handleCheckStatus}
                  checking={checkingId === pat.id}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete PAT</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this token? This action cannot be undone.
              {(() => {
                const target = pats.find((p) => p.id === deleteTarget);
                if (target && target.linked_products_count > 0) {
                  return (
                    <span className="block mt-2 text-destructive font-medium">
                      This PAT is linked to {target.linked_products_count} project{target.linked_products_count > 1 ? "s" : ""}. Deleting it will flag those projects as having a linked PAT issue.
                    </span>
                  );
                }
                return null;
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
