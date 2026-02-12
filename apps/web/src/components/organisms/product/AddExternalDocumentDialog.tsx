"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";

interface AddExternalDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    name: string;
    url: string;
    doc_type: string;
    category: string;
    description?: string;
  }) => Promise<void>;
  isAdding: boolean;
}

const DOC_TYPES = [
  { value: "google_doc", label: "Google Doc" },
  { value: "google_sheet", label: "Google Sheet" },
  { value: "google_slide", label: "Google Slide" },
  { value: "notion", label: "Notion" },
  { value: "figma", label: "Figma" },
  { value: "miro", label: "Miro" },
  { value: "other", label: "Other" },
];

const CATEGORIES = [
  { value: "development", label: "Development" },
  { value: "marketing", label: "Marketing" },
  { value: "production", label: "Production" },
  { value: "project_management", label: "Project Management" },
  { value: "general", label: "General" },
];

export function AddExternalDocumentDialog({
  open,
  onOpenChange,
  onAdd,
  isAdding,
}: AddExternalDocumentDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [docType, setDocType] = useState("google_doc");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd({
      name,
      url,
      doc_type: docType,
      category,
      description: description || undefined,
    });
    setName("");
    setUrl("");
    setDocType("google_doc");
    setCategory("general");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add External Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project Requirements Doc"
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">URL *</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/..."
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={2}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !url.trim() || isAdding}>
              {isAdding ? "Adding..." : "Add Document"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
