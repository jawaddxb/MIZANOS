"use client";

import { useState } from "react";
import { Button } from "@/components/molecules/buttons/Button";
import { knowledgeRepository } from "@/lib/api/repositories";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = [
  { value: "bizdev", label: "BizDev" },
  { value: "product", label: "Product Features" },
  { value: "dev_knowledge", label: "Dev Knowledge" },
  { value: "general", label: "General" },
];

interface CreateKnowledgeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateKnowledgeEntryDialog({
  open,
  onOpenChange,
}: CreateKnowledgeEntryDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await knowledgeRepository.create({
        title: title.trim(),
        content: content.trim() || undefined,
        category,
      });
      await queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
      setTitle("");
      setContent("");
      setCategory("general");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add Knowledge Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title..."
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your knowledge entry..."
              className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Entry"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
