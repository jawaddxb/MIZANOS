"use client";

import { useState } from "react";
import { Button } from "@/components/molecules/buttons/Button";

const DEFAULT_CATEGORIES = [
  "Functionality",
  "Cross-Browser",
  "Mobile",
  "Forms & Inputs",
  "Performance",
  "Accessibility",
  "Security",
];

interface CreateQACheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; description?: string; category: string }) => void;
  isLoading?: boolean;
}

export function CreateQACheckDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateQACheckDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Functionality");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim() || undefined, category });
    setTitle("");
    setDescription("");
    setCategory("Functionality");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add QA Check</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Check title..."
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="w-full min-h-[60px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Check"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
