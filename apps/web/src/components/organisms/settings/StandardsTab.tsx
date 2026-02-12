"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { BaseSwitch } from "@/components/atoms/inputs/BaseSwitch";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/atoms/layout/Dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/atoms/layout/Collapsible";
import { Plus, Trash2, ExternalLink, FileText, ChevronDown, ChevronRight, Eye, Pencil } from "lucide-react";
import { EnhancedMarkdownViewer } from "@/components/molecules/display/EnhancedMarkdownViewer";
import { toast } from "sonner";

interface StandardsRepository {
  id: string; name: string; url: string; description: string | null;
  markdown_content: string | null; is_active: boolean; created_at: string;
}

interface StandardsTabProps {
  className?: string;
  repositories?: StandardsRepository[];
  isLoading?: boolean;
  onCreate?: (data: { name: string; url: string; description: string; markdown_content?: string }) => Promise<void>;
  onToggle?: (id: string, isActive: boolean) => void;
  onDelete?: (id: string) => void;
  onView?: (repo: StandardsRepository) => void;
  onEdit?: (repo: StandardsRepository) => void;
}

function NewRepoForm({ open, onOpenChange, onCreate }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreate?: StandardsTabProps["onCreate"];
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [md, setMd] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name || !url || !onCreate) return;
    setBusy(true);
    try {
      await onCreate({ name, url, description: desc, markdown_content: md || undefined });
      setName(""); setUrl(""); setDesc(""); setMd("");
      onOpenChange(false);
    } catch { toast.error("Failed to create repository"); } finally { setBusy(false); }
  }, [name, url, desc, md, onCreate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Repository</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Standards Repository</DialogTitle>
          <DialogDescription>Add a new code standards repository for audits.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <BaseLabel htmlFor="repo-name">Name</BaseLabel>
              <BaseInput id="repo-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="React TypeScript Standards" />
            </div>
            <div className="space-y-2">
              <BaseLabel htmlFor="repo-url">URL</BaseLabel>
              <BaseInput id="repo-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/company/standards" />
            </div>
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="repo-desc">Description</BaseLabel>
            <BaseInput id="repo-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Code style, folder structure" />
          </div>
          <div className="space-y-2">
            <BaseLabel>Documentation (Markdown)</BaseLabel>
            <BaseTextarea value={md} onChange={(e) => setMd(e.target.value)} placeholder="# Standards Documentation" className="font-mono text-sm min-h-[120px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={busy || !name || !url}>{busy ? "Adding..." : "Add Repository"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RepoItem({ repo, onToggle, onDelete, onView, onEdit }: {
  repo: StandardsRepository; onToggle?: StandardsTabProps["onToggle"]; onDelete?: StandardsTabProps["onDelete"];
  onView?: StandardsTabProps["onView"]; onEdit?: StandardsTabProps["onEdit"];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-start justify-between p-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <h4 className="font-medium">{repo.name}</h4>
              <Badge variant={repo.is_active ? "default" : "outline"}>{repo.is_active ? "Active" : "Inactive"}</Badge>
              {repo.markdown_content && <Badge variant="secondary" className="gap-1"><FileText className="h-3 w-3" />Docs</Badge>}
            </div>
            {repo.description && <p className="text-sm text-muted-foreground mt-1 ml-8">{repo.description}</p>}
            <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2 ml-8 inline-flex items-center gap-1">
              {repo.url}<ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && <Button variant="outline" size="sm" onClick={() => onEdit(repo)}><Pencil className="h-4 w-4 mr-1" />Edit</Button>}
            {onView && repo.markdown_content && <Button variant="outline" size="sm" onClick={() => onView(repo)}><Eye className="h-4 w-4 mr-1" />View</Button>}
            {onToggle && <BaseSwitch checked={repo.is_active} onCheckedChange={() => onToggle(repo.id, !repo.is_active)} />}
            {onDelete && <Button variant="ghost" size="icon" onClick={() => onDelete(repo.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>}
          </div>
        </div>
        <CollapsibleContent>
          <div className="border-t px-4 py-4 bg-muted/30">
            {repo.markdown_content ? <EnhancedMarkdownViewer content={repo.markdown_content} showToc={false} /> : <p className="text-sm text-muted-foreground">No documentation content.</p>}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function StandardsTab({ className, repositories = [], isLoading = false, onCreate, onToggle, onDelete, onView, onEdit }: StandardsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="p-6">
          <h3 className="text-lg font-semibold">Standards Repositories</h3>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        <div className="px-6 pb-6 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Standards Repositories</h3>
            <p className="text-sm text-muted-foreground">Configure code standards and scaffolding repositories for audits</p>
          </div>
          <NewRepoForm open={dialogOpen} onOpenChange={setDialogOpen} onCreate={onCreate} />
        </div>
      </div>
      <div className="px-6 pb-6 space-y-4">
        {repositories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No standards repositories configured. Add one to get started.</p>
        ) : (
          repositories.map((repo) => <RepoItem key={repo.id} repo={repo} onToggle={onToggle} onDelete={onDelete} onView={onView} onEdit={onEdit} />)
        )}
      </div>
    </Card>
  );
}
