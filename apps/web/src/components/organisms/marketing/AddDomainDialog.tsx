"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { useDomainMutations } from "@/hooks/mutations/useMarketingMutations";
import type { MarketingDomain } from "@/lib/types/marketing";

interface AddDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  editDomain: MarketingDomain | null;
}

export function AddDomainDialog({
  open,
  onOpenChange,
  productId,
  editDomain,
}: AddDomainDialogProps) {
  const { createDomain, updateDomain } = useDomainMutations(productId);
  const [domainName, setDomainName] = useState("");
  const [registrar, setRegistrar] = useState("");
  const [sslStatus, setSslStatus] = useState("unknown");

  useEffect(() => {
    if (editDomain) {
      setDomainName(editDomain.domain_name);
      setRegistrar(editDomain.registrar ?? "");
      setSslStatus(editDomain.ssl_status ?? "unknown");
    } else {
      setDomainName("");
      setRegistrar("");
      setSslStatus("unknown");
    }
  }, [editDomain, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      domain_name: domainName,
      registrar: registrar || null,
      ssl_status: sslStatus,
    };

    if (editDomain) {
      updateDomain.mutate(
        { id: editDomain.id, ...data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createDomain.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editDomain ? "Edit Domain" : "Add Domain"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Domain Name *</label>
            <input
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              placeholder="example.com"
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Registrar</label>
            <input
              value={registrar}
              onChange={(e) => setRegistrar(e.target.value)}
              placeholder="GoDaddy, Namecheap, etc."
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium">SSL Status</label>
            <select
              value={sslStatus}
              onChange={(e) => setSslStatus(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
            >
              <option value="unknown">Unknown</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !domainName.trim() ||
                createDomain.isPending ||
                updateDomain.isPending
              }
            >
              {editDomain ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
