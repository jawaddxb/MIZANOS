"use client";

import { useState } from "react";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/atoms/layout/Dialog";
import { useApiKeys } from "@/hooks/queries/useApiKeys";
import { useCreateApiKey, useUpdateApiKey, useDeleteApiKey } from "@/hooks/mutations/useApiKeyMutations";
import { apiKeysRepository } from "@/lib/api/repositories";
import { ApiDocsSection } from "./ApiDocsSection";
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export function ApiKeysTab() {
  const { data: keys = [], isLoading } = useApiKeys();
  const createMutation = useCreateApiKey();
  const updateMutation = useUpdateApiKey();
  const deleteMutation = useDeleteApiKey();
  const [createOpen, setCreateOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const handleReveal = async (id: string) => {
    if (revealedKeys[id]) {
      setRevealedKeys((prev) => { const next = { ...prev }; delete next[id]; return next; });
      return;
    }
    setRevealingId(id);
    try {
      const raw = await apiKeysRepository.reveal(id);
      setRevealedKeys((prev) => ({ ...prev, [id]: raw }));
    } catch { toast.error("Failed to reveal key"); }
    finally { setRevealingId(null); }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  };

  const handleCreate = () => {
    if (!newLabel.trim()) return;
    createMutation.mutate({ label: newLabel.trim() }, {
      onSuccess: (data) => {
        setRawKey(data.raw_key);
        setNewLabel("");
      },
    });
  };

  const handleCopy = () => {
    if (rawKey) {
      navigator.clipboard.writeText(rawKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setRawKey(null);
    setNewLabel("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Keys</h3>
          <p className="text-sm text-muted-foreground">Create keys to access Mizan OS from external tools like curl or Claude terminal.</p>
        </div>
        <BaseButton size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create Key
        </BaseButton>
      </div>

      <ApiDocsSection />

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {keys.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Key className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No API keys yet. Create one to get started.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {keys.map((key) => (
          <Card key={key.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{key.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}...</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {key.last_used_at && (
                    <span className="text-[10px] text-muted-foreground">
                      Used {new Date(key.last_used_at).toLocaleDateString()}
                    </span>
                  )}
                  <BaseButton
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleReveal(key.id)}
                    disabled={revealingId === key.id}
                  >
                    {revealedKeys[key.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </BaseButton>
                  <Badge
                    variant={key.is_active ? "default" : "secondary"}
                    className={cn("text-[10px] cursor-pointer", key.is_active ? "bg-emerald-600" : "bg-muted")}
                    onClick={() => updateMutation.mutate({ id: key.id, is_active: !key.is_active })}
                  >
                    {key.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <BaseButton
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(key.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </BaseButton>
                </div>
              </div>
              {revealedKeys[key.id] && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary border">
                  <code className="flex-1 text-xs font-mono break-all select-all">{revealedKeys[key.id]}</code>
                  <BaseButton variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleCopyKey(revealedKeys[key.id])}>
                    <Copy className="h-3.5 w-3.5" />
                  </BaseButton>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {rawKey ? "API Key Created" : "Create API Key"}
            </DialogTitle>
            <DialogDescription>
              {rawKey ? "Copy your key now. It won't be shown again." : "Give your key a label to identify it."}
            </DialogDescription>
          </DialogHeader>

          {!rawKey ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <BaseLabel>Label</BaseLabel>
                <BaseInput
                  placeholder="e.g., Claude Terminal, CI/CD Pipeline"
                  value={newLabel}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLabel(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <BaseButton variant="outline" onClick={handleCloseCreate}>Cancel</BaseButton>
                <BaseButton onClick={handleCreate} disabled={!newLabel.trim() || createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Generate Key"}
                </BaseButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-md bg-secondary border">
                <code className="flex-1 text-xs font-mono break-all select-all">{rawKey}</code>
                <BaseButton variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </BaseButton>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>This key will only be shown once. Copy it now and store it securely.</span>
              </div>
              <div className="flex justify-end">
                <BaseButton onClick={handleCloseCreate}>Done</BaseButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
