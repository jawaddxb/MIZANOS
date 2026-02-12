"use client";

import { useState } from "react";
import { Button } from "@/components/molecules/buttons/Button";
import { Badge } from "@/components/atoms/display/Badge";
import { Globe, Plus, Pencil, Trash2 } from "lucide-react";
import { useDomainMutations } from "@/hooks/mutations/useMarketingMutations";
import type { MarketingDomain } from "@/lib/types/marketing";
import { AddDomainDialog } from "./AddDomainDialog";

interface DomainsSectionProps {
  domains: MarketingDomain[];
  productId: string;
}

export function DomainsSection({ domains, productId }: DomainsSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<MarketingDomain | null>(null);
  const { deleteDomain } = useDomainMutations(productId);

  if (domains.length === 0 && !addOpen) {
    return (
      <div className="text-center py-8">
        <Globe className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">No domains configured</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Domain
        </Button>
        <AddDomainDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          productId={productId}
          editDomain={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Domain
        </Button>
      </div>
      {domains.map((d) => (
        <div
          key={d.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <span className="font-medium text-sm">{d.domain_name}</span>
              {d.registrar && (
                <p className="text-xs text-muted-foreground">{d.registrar}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={d.ssl_status === "active" ? "default" : "secondary"}
              className="text-[10px]"
            >
              {d.ssl_status ?? "unknown"}
            </Badge>
            <button
              onClick={() => { setEditingDomain(d); setAddOpen(true); }}
              className="p-1.5 rounded hover:bg-accent"
              title="Edit domain"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => deleteDomain.mutate(d.id)}
              className="p-1.5 rounded hover:bg-destructive/10"
              title="Delete domain"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        </div>
      ))}
      <AddDomainDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setEditingDomain(null);
        }}
        productId={productId}
        editDomain={editingDomain}
      />
    </div>
  );
}
