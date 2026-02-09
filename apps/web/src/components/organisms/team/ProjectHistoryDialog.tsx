"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { useProfileProjects } from "@/hooks/queries/useProfileProjects";
import type { ProfileProject } from "@/lib/types";

interface ProjectHistoryDialogProps {
  profileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ProjectHistoryDialog({
  profileId,
  open,
  onOpenChange,
}: ProjectHistoryDialogProps) {
  const { data: projects = [], isLoading } = useProfileProjects(profileId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Project History</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No project history available.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {projects.map((project: ProfileProject) => (
              <div
                key={project.productId}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <span className="text-sm font-medium">
                    {project.productName}
                  </span>
                  {project.role && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {project.role}
                      </Badge>
                    </div>
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

export { ProjectHistoryDialog };
export type { ProjectHistoryDialogProps };
