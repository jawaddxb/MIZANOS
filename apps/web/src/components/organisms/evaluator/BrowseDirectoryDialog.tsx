"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";
import { Button } from "@/components/molecules/buttons/Button";
import { useDirectoryBrowser } from "@/hooks/queries/useDirectoryBrowser";
import { Folder, ArrowUp, Loader2 } from "lucide-react";

interface BrowseDirectoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string) => void;
}

function BrowseDirectoryDialog({
  open,
  onOpenChange,
  onSelect,
}: BrowseDirectoryDialogProps) {
  const [currentPath, setCurrentPath] = useState<string | undefined>(undefined);
  const { data, isLoading } = useDirectoryBrowser(currentPath, open);

  const handleSelect = () => {
    if (data?.current_path) {
      onSelect(data.current_path);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Browse for Repository</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border bg-muted/50 px-3 py-2">
          <p className="truncate font-mono text-xs text-muted-foreground">
            {data?.current_path ?? "Loading..."}
          </p>
        </div>

        <ScrollArea className="h-[320px] rounded-md border">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-1">
              {data?.parent_path && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setCurrentPath(data.parent_path!)}
                >
                  <ArrowUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">..</span>
                </button>
              )}
              {data?.entries.map((entry) => (
                <button
                  key={entry.path}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setCurrentPath(entry.path)}
                >
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="truncate">{entry.name}</span>
                </button>
              ))}
              {data?.entries.length === 0 && !data?.parent_path && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No subdirectories found
                </p>
              )}
              {data?.entries.length === 0 && data?.parent_path && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Empty directory
                </p>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!data?.current_path}>
            Select This Directory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { BrowseDirectoryDialog };
