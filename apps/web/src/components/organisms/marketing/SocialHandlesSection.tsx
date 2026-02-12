"use client";

import { useState } from "react";
import { Button } from "@/components/molecules/buttons/Button";
import { Share2, Plus, Pencil, Trash2 } from "lucide-react";
import { useSocialHandleMutations } from "@/hooks/mutations/useMarketingMutations";
import type { MarketingSocialHandle } from "@/lib/types/marketing";
import { AddSocialHandleDialog } from "./AddSocialHandleDialog";

interface SocialHandlesSectionProps {
  handles: MarketingSocialHandle[];
  productId: string;
}

export function SocialHandlesSection({ handles, productId }: SocialHandlesSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingHandle, setEditingHandle] = useState<MarketingSocialHandle | null>(null);
  const { deleteHandle } = useSocialHandleMutations(productId);

  if (handles.length === 0 && !addOpen) {
    return (
      <div className="text-center py-8">
        <Share2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">No social handles added</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Handle
        </Button>
        <AddSocialHandleDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          productId={productId}
          editHandle={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Handle
        </Button>
      </div>
      {handles.map((h) => (
        <div key={h.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-sm capitalize font-medium">{h.platform}</span>
              <span className="text-sm font-mono ml-2">{h.handle}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setEditingHandle(h); setAddOpen(true); }}
              className="p-1.5 rounded hover:bg-accent"
              title="Edit handle"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => deleteHandle.mutate(h.id)}
              className="p-1.5 rounded hover:bg-destructive/10"
              title="Delete handle"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        </div>
      ))}
      <AddSocialHandleDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setEditingHandle(null);
        }}
        productId={productId}
        editHandle={editingHandle}
      />
    </div>
  );
}
