"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";

const SAFE_STATUSES = new Set(["draft", "backlog", "cancelled"]);

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  taskStatus: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function DeleteTaskDialog({
  open,
  onOpenChange,
  taskTitle,
  taskStatus,
  onConfirm,
  isPending = false,
}: DeleteTaskDialogProps) {
  const isSafe = SAFE_STATUSES.has(taskStatus);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) setAcknowledged(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
          <DialogDescription>
            {isSafe
              ? `Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`
              : `"${taskTitle}" is currently ${taskStatus.replace("_", " ")}. Deleting an active task will permanently remove all associated data.`}
          </DialogDescription>
        </DialogHeader>

        {!isSafe && (
          <label className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 accent-destructive"
            />
            <span className="text-destructive/90">
              I fully understand the risk of deleting this active task
            </span>
          </label>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending || (!isSafe && !acknowledged)}
            loading={isPending}
          >
            Delete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
