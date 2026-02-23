"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {task.description || "No description provided."}
        </p>
      </DialogContent>
    </Dialog>
  );
}
