"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { scrapeRepository, specificationsRepository } from "@/lib/api/repositories";
import type { JsonValue } from "@/lib/types";

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}

const SOURCE_TYPES = [
  { value: "website", label: "Website URL" },
  { value: "markdown", label: "Markdown" },
  { value: "paste", label: "Open Text" },
  { value: "document", label: "File Upload" },
] as const;

type SourceType = (typeof SOURCE_TYPES)[number]["value"];

export function AddSourceDialog({ open, onOpenChange, productId }: AddSourceDialogProps) {
  const queryClient = useQueryClient();
  const [sourceType, setSourceType] = useState<SourceType>("website");
  const [url, setUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setUrl("");
    setTextContent("");
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (sourceType === "website") {
        const scraped = await scrapeRepository.scrape(url);
        const analysis = await scrapeRepository.analyze(scraped.content, url);
        await specificationsRepository.createSource({
          product_id: productId,
          source_type: "website",
          url,
          raw_content: scraped.content,
          ai_summary: analysis as unknown as JsonValue,
        });
      } else if (sourceType === "markdown" || sourceType === "paste") {
        await specificationsRepository.createSource({
          product_id: productId,
          source_type: sourceType,
          raw_content: textContent,
        });
      } else if (sourceType === "document" && selectedFile) {
        await specificationsRepository.uploadSource(productId, selectedFile);
      }

      queryClient.invalidateQueries({ queryKey: ["specification-sources", productId] });
      toast.success("Source added successfully");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Failed to add source");
    } finally {
      setIsSaving(false);
    }
  };

  const isValid =
    (sourceType === "website" && url.trim().length > 0) ||
    ((sourceType === "markdown" || sourceType === "paste") && textContent.trim().length > 0) ||
    (sourceType === "document" && selectedFile !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Source</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => { setSourceType(e.target.value as SourceType); resetForm(); }}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {sourceType === "website" && (
            <div>
              <label className="text-sm font-medium">URL *</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
                required
              />
            </div>
          )}

          {(sourceType === "markdown" || sourceType === "paste") && (
            <div>
              <label className="text-sm font-medium">
                {sourceType === "markdown" ? "Markdown Content" : "Open Text"} *
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={sourceType === "markdown" ? "# Your markdown..." : "Paste content here..."}
                rows={6}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background resize-none"
                required
              />
            </div>
          )}

          {sourceType === "document" && (
            <div>
              <label className="text-sm font-medium">Upload File *</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.md,.txt,.csv,.json,.yaml,.yml,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
                required
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-1">Selected: {selectedFile.name}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  {sourceType === "website" ? "Scraping & Saving..." : "Saving..."}
                </>
              ) : (
                "Add Source"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
