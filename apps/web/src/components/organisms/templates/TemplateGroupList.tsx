"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { useTaskTemplateGroups } from "@/hooks/queries/useTaskTemplateGroups";
import { TemplateGroupCard } from "./TemplateGroupCard";
import type { TaskTemplateGroup } from "@/lib/types";

interface TemplateGroupListProps {
  sourceType?: string;
  onEdit: (group: TaskTemplateGroup) => void;
  onDelete: (group: TaskTemplateGroup) => void;
  onToggleActive: (group: TaskTemplateGroup, active: boolean) => void;
}

export function TemplateGroupList({
  sourceType,
  onEdit,
  onDelete,
  onToggleActive,
}: TemplateGroupListProps) {
  const { data: groups = [], isLoading } = useTaskTemplateGroups(sourceType);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return groups;
    const q = search.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, search]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <BaseInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search
              ? "No groups match your search."
              : "No template groups yet. Create one to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((group) => (
            <TemplateGroupCard
              key={group.id}
              group={group}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
