"use client";

import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";
import { Button } from "@/components/molecules/buttons/Button";
import { cn } from "@/lib/utils/cn";
import { Search, Filter, X } from "lucide-react";

interface ProductsFilterBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  pillarFilter: string;
  onPillarChange: (v: string) => void;
  stageFilter: string;
  onStageChange: (v: string) => void;
  stages: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function ProductsFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  pillarFilter,
  onPillarChange,
  stageFilter,
  onStageChange,
  stages,
  hasActiveFilters,
  onClearFilters,
}: ProductsFilterBarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <BaseInput
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onSearchChange(e.target.value)
          }
          className="pl-9 bg-card"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger
          className={cn(
            "w-36 bg-card",
            statusFilter !== "all" && "border-primary/30",
          )}
        >
          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="healthy">Healthy</SelectItem>
          <SelectItem value="warning">Warning</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>
      <Select value={pillarFilter} onValueChange={onPillarChange}>
        <SelectTrigger
          className={cn(
            "w-40 bg-card",
            pillarFilter !== "all" && "border-primary/30",
          )}
        >
          <SelectValue placeholder="Pillar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Pillars</SelectItem>
          <SelectItem value="business">Business</SelectItem>
          <SelectItem value="marketing">Marketing</SelectItem>
          <SelectItem value="development">Development</SelectItem>
          <SelectItem value="product">Product</SelectItem>
        </SelectContent>
      </Select>
      <Select value={stageFilter} onValueChange={onStageChange}>
        <SelectTrigger
          className={cn(
            "w-36 bg-card",
            stageFilter !== "all" && "border-primary/30",
          )}
        >
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          {stages.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {stage}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
