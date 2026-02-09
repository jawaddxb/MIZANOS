"use client";

import * as React from "react";

import { Upload, X, FileText, FileImage, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/molecules/buttons/Button";

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
}

interface DocumentUploadProps {
  onFilesChange: (files: File[]) => void;
  className?: string;
}

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.md,.txt,.png,.jpg,.jpeg,.webp";

function getFileIcon(file: File): React.ElementType {
  if (file.type.startsWith("image/")) return FileImage;
  if (
    file.type.includes("pdf") ||
    file.type.includes("word") ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".txt")
  ) {
    return FileText;
  }
  return FileIcon;
}

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function DocumentUpload({ onFilesChange, className }: DocumentUploadProps) {
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = React.useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const uploaded: UploadedFile[] = Array.from(newFiles).map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));
      setFiles((prev) => {
        const updated = [...prev, ...uploaded];
        onFilesChange(updated.map((f) => f.file));
        return updated;
      });
    },
    [onFilesChange],
  );

  const removeFile = React.useCallback(
    (id: string) => {
      setFiles((prev) => {
        const target = prev.find((f) => f.id === id);
        if (target?.preview) URL.revokeObjectURL(target.preview);
        const updated = prev.filter((f) => f.id !== id);
        onFilesChange(updated.map((f) => f.file));
        return updated;
      });
    },
    [onFilesChange],
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <p className="mb-1 text-sm font-medium text-foreground">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, Markdown, TXT, or images up to 20MB
        </p>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((uf) => {
            const Icon = getFileIcon(uf.file);
            return (
              <li key={uf.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                {uf.preview ? (
                  <img src={uf.preview} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-secondary">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{uf.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(uf.file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); removeFile(uf.id); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
