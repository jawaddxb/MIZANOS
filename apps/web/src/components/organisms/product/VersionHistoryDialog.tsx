"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { Loader2, FileText, RotateCcw } from "lucide-react";
import { documentsRepository } from "@/lib/api/repositories";
import { useRestoreVersion } from "@/hooks/mutations/useDocumentVersionMutations";
import type { DocumentVersion } from "@/lib/types";

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  documentId,
}: VersionHistoryDialogProps) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["document-versions", documentId],
    queryFn: (): Promise<DocumentVersion[]> =>
      documentsRepository.getVersions(documentId),
    enabled: open && !!documentId,
  });
  const restoreVersion = useRestoreVersion(documentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && versions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No version history available
            </p>
          </div>
        )}

        {!isLoading && versions.length > 0 && (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary shrink-0">
                  v{version.version_number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Version {version.version_number}
                    </span>
                    {version.is_current && (
                      <Badge variant="default" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(version.created_at).toLocaleString()}
                  </p>
                  {version.change_notes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {version.change_notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {(version.file_size / 1024).toFixed(1)} KB
                    {version.file_type ? ` - ${version.file_type}` : ""}
                  </p>
                  {!version.is_current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 mt-1 text-xs"
                      onClick={() => restoreVersion.mutate(version.id)}
                      disabled={restoreVersion.isPending}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
