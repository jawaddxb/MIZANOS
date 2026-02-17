"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/atoms/layout/Dialog";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { SearchableSelect } from "@/components/molecules/forms/SearchableSelect";
import type { OrgChartNode } from "@/lib/types";

interface ChangeManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetNode: OrgChartNode | null;
  allNodes: OrgChartNode[];
  onConfirm: (profileId: string, managerId: string | null) => void;
  isPending: boolean;
}

export function ChangeManagerDialog({
  open,
  onOpenChange,
  targetNode,
  allNodes,
  onConfirm,
  isPending,
}: ChangeManagerDialogProps) {
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  const managerOptions = allNodes
    .filter((n) => n.id !== targetNode?.id && n.status === "active")
    .map((n) => ({ value: n.id, label: n.full_name ?? n.email ?? n.id }));

  const handleConfirm = () => {
    if (!targetNode) return;
    onConfirm(targetNode.id, selectedManagerId || null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Manager</DialogTitle>
          <DialogDescription>
            Set who {targetNode?.full_name ?? "this person"} reports to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <SearchableSelect
            label="Manager"
            options={managerOptions}
            value={selectedManagerId}
            onValueChange={setSelectedManagerId}
            placeholder="Search by name..."
            allowClear
            clearLabel="No manager (root)"
          />
        </div>

        <DialogFooter>
          <BaseButton variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </BaseButton>
          <BaseButton onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </BaseButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
