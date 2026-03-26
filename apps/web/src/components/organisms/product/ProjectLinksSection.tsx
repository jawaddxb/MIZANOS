"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Button } from "@/components/molecules/buttons/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Link2, Plus, ExternalLink, Trash2, Pencil, Loader2 } from "lucide-react";
import { useProjectLinks } from "@/hooks/queries/useProjectLinks";
import {
  useCreateProjectLink,
  useUpdateProjectLink,
  useDeleteProjectLink,
} from "@/hooks/mutations/useProjectLinkMutations";
import type { ProjectLink } from "@/lib/types";

interface ProjectLinksSectionProps {
  productId: string;
}

export function ProjectLinksSection({ productId }: ProjectLinksSectionProps) {
  const { data: links, isLoading } = useProjectLinks(productId);
  const createLink = useCreateProjectLink(productId);
  const updateLink = useUpdateProjectLink(productId);
  const deleteLink = useDeleteProjectLink(productId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProjectLink | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const openAdd = () => {
    setEditingLink(null);
    setName("");
    setUrl("");
    setDialogOpen(true);
  };

  const openEdit = (link: ProjectLink) => {
    setEditingLink(link);
    setName(link.name);
    setUrl(link.url);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    const finalUrl =
      trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")
        ? trimmedUrl
        : `https://${trimmedUrl}`;

    if (editingLink) {
      updateLink.mutate(
        { linkId: editingLink.id, data: { name: name.trim(), url: finalUrl } },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createLink.mutate(
        { name: name.trim(), url: finalUrl },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Project Links
          </CardTitle>
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Link
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(links ?? []).length === 0 ? (
          <div className="text-center py-6">
            <Link2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No links added yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add production, staging, railway, or other project URLs
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {links?.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{link.name}</p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary truncate block"
                  >
                    {link.url}
                  </a>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-accent"
                    title="Open link"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                  <button
                    onClick={() => openEdit(link)}
                    className="p-1.5 rounded hover:bg-accent"
                    title="Edit link"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteLink.mutate(link.id)}
                    className="p-1.5 rounded hover:bg-destructive/10"
                    title="Remove link"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? "Edit Link" : "Add Project Link"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Link Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production, Railway, Testing"
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL *</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || !url.trim() || createLink.isPending || updateLink.isPending}
              >
                {editingLink ? "Save" : "Add Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
