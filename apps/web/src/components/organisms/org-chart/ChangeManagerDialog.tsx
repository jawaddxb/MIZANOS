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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
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
  const [selectedManagerId, setSelectedManagerId] = useState<string>("__none__");

  const eligibleManagers = allNodes.filter(
    (n) => n.id !== targetNode?.id && n.status === "active",
  );

  const handleConfirm = () => {
    if (!targetNode) return;
    const managerId = selectedManagerId === "__none__" ? null : selectedManagerId;
    onConfirm(targetNode.id, managerId);
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
          <BaseLabel>Manager</BaseLabel>
          <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No manager (root)</SelectItem>
              {eligibleManagers.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.full_name ?? n.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
