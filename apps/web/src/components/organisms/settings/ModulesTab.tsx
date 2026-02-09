"use client";

import { useMemo, useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { settingsRepository } from "@/lib/api/repositories";
import type { Module } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ModulesTabProps {
  className?: string;
  isAdmin?: boolean;
  onCreateModule?: () => void;
  onEditModule?: (module: Module) => void;
}

function useModules() {
  return useQuery({
    queryKey: ["settings", "modules"],
    queryFn: () => settingsRepository.getModules(),
  });
}

function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => settingsRepository.deleteModule(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "modules"] });
      toast.success("Module deleted");
    },
    onError: () => {
      toast.error("Failed to delete module");
    },
  });
}

function ModuleCard({
  module,
  isAdmin,
  onEdit,
  onDelete,
}: {
  module: Module;
  isAdmin: boolean;
  onEdit?: (module: Module) => void;
  onDelete?: (moduleId: string) => void;
}) {
  return (
    <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors group">
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-foreground">{module.name}</h4>
        {isAdmin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(module)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(module.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
      {module.description && (
        <p className="text-sm text-muted-foreground mt-1">
          {module.description}
        </p>
      )}
      <div className="flex items-center gap-3 mt-3">
        {module.docs_url && (
          <a
            href={module.docs_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            Docs
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {module.scaffolding_url && (
          <a
            href={module.scaffolding_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            Scaffolding
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export function ModulesTab({
  className,
  isAdmin = false,
  onCreateModule,
  onEditModule,
}: ModulesTabProps) {
  const { data: modules = [], isLoading } = useModules();
  const deleteModule = useDeleteModule();

  const modulesByCategory = useMemo(() => {
    const grouped: Record<string, Module[]> = {};
    modules.forEach((m) => {
      const cat = m.category || "Uncategorized";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(m);
    });
    return grouped;
  }, [modules]);

  const categories = useMemo(() => Object.keys(modulesByCategory), [modulesByCategory]);

  const handleDelete = useCallback((moduleId: string) => {
    deleteModule.mutate(moduleId);
  }, [deleteModule]);

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="p-6">
          <h3 className="text-lg font-semibold">Module Library</h3>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        <div className="px-6 pb-6 space-y-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Module Library</h3>
            <p className="text-sm text-muted-foreground">
              Available integrations and their scaffolding repositories
            </p>
          </div>
          {isAdmin && onCreateModule && (
            <Button size="sm" onClick={onCreateModule}>
              Add Module
            </Button>
          )}
        </div>
      </div>
      <div className="px-6 pb-6">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No modules available yet.
          </p>
        ) : (
          categories.map((category) => (
            <div key={category} className="mb-6 last:mb-0">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {modulesByCategory[category]?.map((mod) => (
                  <ModuleCard
                    key={mod.id}
                    module={mod}
                    isAdmin={isAdmin}
                    onEdit={onEditModule}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
