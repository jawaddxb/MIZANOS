"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/atoms/layout/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { specificationsRepository } from "@/lib/api/repositories";
import { toast } from "sonner";

const CATEGORIES = [
  "authentication",
  "payments",
  "notifications",
  "analytics",
  "ui",
  "integration",
  "other",
] as const;

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

interface AddToLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureId?: string;
}

export function AddToLibraryDialog({
  open,
  onOpenChange,
  featureId,
}: AddToLibraryDialogProps) {
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [targetFeatureId, setTargetFeatureId] = useState(featureId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!targetFeatureId) {
      toast.error("Feature ID is required");
      return;
    }
    if (!category) {
      toast.error("Category is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await specificationsRepository.updateFeature(targetFeatureId, {
        is_reusable: true,
        reusable_category: category,
        ...(priority ? { priority } : {}),
      });
      toast.success("Feature marked as reusable");
      onOpenChange(false);
      setCategory("");
      setPriority("");
      setTargetFeatureId("");
    } catch {
      toast.error("Failed to mark feature as reusable");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add to Library
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Feature as Reusable</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!featureId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Feature ID</label>
              <BaseInput
                placeholder="Enter feature ID"
                value={targetFeatureId}
                onChange={(e) => setTargetFeatureId(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Priority Override</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Keep existing priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Mark as Reusable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
