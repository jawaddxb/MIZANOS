"use client";

import { useMemo } from "react";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";
import { SearchableSelect } from "@/components/molecules/forms/SearchableSelect";
import { Button } from "@/components/molecules/buttons/Button";
import { TASK_STATUSES, TASK_PRIORITIES, TASK_PILLARS, TASK_STATUS_DISPLAY } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { Search, Filter, X } from "lucide-react";
import type { Product, Profile } from "@/lib/types";

interface TasksFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  projectFilter: string;
  onProjectChange: (v: string) => void;
  assigneeFilter: string;
  onAssigneeChange: (v: string) => void;
  pmFilter: string;
  onPmChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  pillarFilter: string;
  onPillarChange: (v: string) => void;
  projects: Product[];
  profiles: Profile[];
  pmProfiles: Profile[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function TasksFilterBar({
  search,
  onSearchChange,
  projectFilter,
  onProjectChange,
  assigneeFilter,
  onAssigneeChange,
  pmFilter,
  onPmChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  pillarFilter,
  onPillarChange,
  projects,
  profiles,
  pmProfiles,
  hasActiveFilters,
  onClearFilters,
}: TasksFilterBarProps) {
  const assigneeOptions = useMemo(
    () => profiles.map((p) => ({ value: p.id, label: p.full_name ?? p.email ?? "Unknown" })),
    [profiles],
  );
  const pmOptions = useMemo(
    () => pmProfiles.map((p) => ({ value: p.id, label: p.full_name ?? p.email ?? "Unknown" })),
    [pmProfiles],
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[160px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <BaseInput
          placeholder="Search tasks..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          className="pl-9 bg-card"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Select value={projectFilter} onValueChange={onProjectChange}>
        <SelectTrigger className={cn("w-[150px] shrink-0 bg-card", projectFilter !== "all" && "border-primary/30")}>
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-[150px] shrink-0">
        <SearchableSelect
          options={assigneeOptions}
          value={assigneeFilter === "all" ? "" : assigneeFilter}
          onValueChange={(v) => onAssigneeChange(v || "all")}
          placeholder="All Assignees"
          allowClear
          clearLabel="All Assignees"
        />
      </div>

      <div className="w-[150px] shrink-0">
        <SearchableSelect
          options={pmOptions}
          value={pmFilter === "all" ? "" : pmFilter}
          onValueChange={(v) => onPmChange(v || "all")}
          placeholder="All PMs"
          allowClear
          clearLabel="All PMs"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className={cn("w-[140px] shrink-0 bg-card", statusFilter !== "all" && "border-primary/30")}>
          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{TASK_STATUS_DISPLAY[s].label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className={cn("w-[130px] shrink-0 bg-card", priorityFilter !== "all" && "border-primary/30")}>
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={pillarFilter} onValueChange={onPillarChange}>
        <SelectTrigger className={cn("w-[130px] shrink-0 bg-card", pillarFilter !== "all" && "border-primary/30")}>
          <SelectValue placeholder="Vertical" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Verticals</SelectItem>
          {TASK_PILLARS.map((p) => (
            <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
