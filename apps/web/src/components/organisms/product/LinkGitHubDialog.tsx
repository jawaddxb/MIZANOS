"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { useUpdateProduct } from "@/hooks/mutations/useProductMutations";
import { Github } from "lucide-react";

interface LinkGitHubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  currentUrl?: string | null;
}

export function LinkGitHubDialog({
  open,
  onOpenChange,
  productId,
  currentUrl,
}: LinkGitHubDialogProps) {
  const [repoUrl, setRepoUrl] = useState(currentUrl ?? "");
  const updateProduct = useUpdateProduct();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct.mutate(
      { id: productId, repository_url: repoUrl.trim() || null },
      { onSuccess: () => onOpenChange(false) },
    );
  };

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
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Repository URL</label>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Enter the full GitHub repository URL to enable commit tracking, pull requests, and code analysis.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? "Saving..." : currentUrl ? "Update" : "Link Repository"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
