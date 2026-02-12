"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { useUpsertEnvironment } from "@/hooks/mutations/useEnvironmentMutations";
import type { ProductEnvironment, EnvironmentType } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface ConfigureEnvironmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  environmentType: EnvironmentType;
  existing?: ProductEnvironment;
}

export function ConfigureEnvironmentDialog({
  open,
  onOpenChange,
  productId,
  environmentType,
  existing,
}: ConfigureEnvironmentDialogProps) {
  const [url, setUrl] = useState(existing?.url ?? "");
  const [branch, setBranch] = useState(existing?.branch ?? "");
  const [targetDomain, setTargetDomain] = useState(existing?.target_domain ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const upsert = useUpsertEnvironment();

  const handleSave = () => {
    upsert.mutate(
      {
        product_id: productId,
        environment_type: environmentType,
        url: url || undefined,
        branch: branch || undefined,
        target_domain: targetDomain || undefined,
        notes: notes || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure {environmentType} Environment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <BaseLabel htmlFor="env-url">URL</BaseLabel>
            <BaseInput id="env-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="env-branch">Branch</BaseLabel>
            <BaseInput id="env-branch" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="env-domain">Target Domain</BaseLabel>
            <BaseInput id="env-domain" value={targetDomain} onChange={(e) => setTargetDomain(e.target.value)} placeholder="example.com" />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="env-notes">Notes</BaseLabel>
            <BaseTextarea id="env-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
