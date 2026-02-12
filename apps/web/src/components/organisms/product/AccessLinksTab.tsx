"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import {
  useAccessLinks,
  useCreateAccessLink,
  useRevokeAccessLink,
} from "@/hooks/mutations/useAccessLinkMutations";
import { Link2, Plus, Copy, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { toast } from "sonner";

interface AccessLinksTabProps {
  productId: string;
}

export function AccessLinksTab({ productId }: AccessLinksTabProps) {
  const { data: links, isLoading } = useAccessLinks(productId);
  const createLink = useCreateAccessLink(productId);
  const revokeLink = useRevokeAccessLink(productId);
  const [createOpen, setCreateOpen] = useState(false);
  const [linkName, setLinkName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createLink.mutate(
      { name: linkName },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setLinkName("");
        },
      },
    );
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Access Links</h3>
          <p className="text-xs text-muted-foreground">
            Create shareable links for stakeholders to view documents
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create Link
        </Button>
      </div>

      {(links ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Link2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No access links yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {links?.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{link.name}</span>
                  <Badge
                    variant={link.is_active ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {link.is_active ? "Active" : "Revoked"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{link.access_count ?? 0} views</span>
                  {link.expires_at && (
                    <span>
                      Expires{" "}
                      {new Date(link.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {link.is_active && (
                  <button
                    onClick={() => copyLink(link.token)}
                    className="p-1.5 rounded hover:bg-accent"
                    title="Copy link"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => revokeLink.mutate(link.id)}
                  className="p-1.5 rounded hover:bg-destructive/10"
                  title="Revoke link"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Access Link</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Link Name *</label>
              <input
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                placeholder="Client Review Link"
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!linkName.trim() || createLink.isPending}
              >
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
