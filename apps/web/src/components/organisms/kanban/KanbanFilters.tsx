"use client";

import { Search } from "lucide-react";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { SelectField } from "@/components/molecules/forms/SelectField";
import { useProfiles } from "@/hooks/queries/useProfiles";
import type { PillarType, TaskPriority } from "@/lib/types";
import { PILLAR_ORDER } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Option constants                                                   */
/* ------------------------------------------------------------------ */

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const PILLAR_OPTIONS = [
  { value: "all", label: "All Pillars" },
  ...PILLAR_ORDER.map((p) => ({
    value: p,
    label: p.charAt(0).toUpperCase() + p.slice(1),
  })),
];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface KanbanFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  pillar: PillarType | "all";
  onPillarChange: (value: PillarType | "all") => void;
  priority: TaskPriority | "all";
  onPriorityChange: (value: TaskPriority | "all") => void;
  assignee: string;
  onAssigneeChange: (value: string) => void;
  productId: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KanbanFilters({
  search,
  onSearchChange,
  pillar,
  onPillarChange,
  priority,
  onPriorityChange,
  assignee,
  onAssigneeChange,
  productId,
}: KanbanFiltersProps) {
  const { data: profiles = [] } = useProfiles();

  const assigneeOptions = [
    { value: "all", label: "All Assignees" },
    { value: "unassigned", label: "Unassigned" },
    ...profiles.map((p) => ({
      value: p.id,
      label: p.full_name ?? p.email ?? "Unnamed",
    })),
  ];

  const handleClearAll = () => {
    onSearchChange("");
    onPillarChange("all");
    onPriorityChange("all");
    onAssigneeChange("all");
  };

  const hasActiveFilters =
    search !== "" ||
    pillar !== "all" ||
    priority !== "all" ||
    assignee !== "all";

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <BaseInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="pl-9"
        />
      </div>

      {/* Pillar filter */}
      <div className="w-40">
        <SelectField
          placeholder="Pillar"
          options={PILLAR_OPTIONS}
          value={pillar}
          onValueChange={(v) => onPillarChange(v as PillarType | "all")}
        />
      </div>

      {/* Priority filter */}
      <div className="w-40">
        <SelectField
          placeholder="Priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onValueChange={(v) => onPriorityChange(v as TaskPriority | "all")}
        />
      </div>

      {/* Assignee filter */}
      <div className="w-44">
        <SelectField
          placeholder="Assignee"
          options={assigneeOptions}
          value={assignee}
          onValueChange={onAssigneeChange}
        />
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <BaseButton
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-muted-foreground"
        >
          Clear filters
        </BaseButton>
      )}
    </div>
  );
}
