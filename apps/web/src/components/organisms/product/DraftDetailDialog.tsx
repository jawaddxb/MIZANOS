"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/atoms/layout/Dialog";

interface DraftDetailDialogProps {
  task: { title: string; description: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DraftDetailDialog({ task, open, onOpenChange }: DraftDetailDialogProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            {task.description || "No description provided."}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
