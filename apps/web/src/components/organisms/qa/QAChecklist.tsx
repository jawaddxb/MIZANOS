"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Circle,
  Filter,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { Badge } from "@/components/atoms/display/Badge";
import { Progress } from "@/components/atoms/feedback/Progress";
import { QAChecklistItem } from "./QAChecklistItem";
import { CreateQACheckDialog } from "./CreateQACheckDialog";
import type { QACheck } from "@/lib/types/qa";

interface QAChecklistProps {
  productId: string;
  items: QACheck[];
  onStatusChange: (id: string, status: "pending" | "passed" | "failed") => void;
  onNotesChange: (id: string, notes: string) => void;
  onAddCheck: (data: { title: string; description?: string; category: string }) => void;
  onAutoGenerate?: () => void;
  onSignOff?: () => void;
  isLoading?: boolean;
  isGenerating?: boolean;
}

export function QAChecklist({
  productId,
  items,
  onStatusChange,
  onNotesChange,
  onAddCheck,
  onAutoGenerate,
  onSignOff,
  isLoading,
  isGenerating,
}: QAChecklistProps) {
  const [filter, setFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const categories = [...new Set(items.map((i) => i.category))];

  const filteredItems = items.filter((item) => {
    const matchesStatus = filter === "all" || item.status === filter;
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const passedCount = items.filter((i) => i.status === "passed").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const progressPercent =
    items.length > 0 ? Math.round((passedCount / items.length) * 100) : 0;
  const canSignOff = failedCount === 0 && pendingCount === 0 && items.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Progress" value={`${progressPercent}%`}>
          <Progress value={progressPercent} className="h-1.5 mt-2" />
        </SummaryCard>
        <SummaryCard
          label="Passed"
          value={passedCount}
          icon={<CheckCircle2 className="h-4 w-4 text-status-healthy" />}
          valueClass="text-status-healthy"
        />
        <SummaryCard
          label="Failed"
          value={failedCount}
          icon={<XCircle className="h-4 w-4 text-status-critical" />}
          valueClass="text-status-critical"
        />
        <SummaryCard
          label="Pending"
          value={pendingCount}
          icon={<Circle className="h-4 w-4" />}
        />
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {onAutoGenerate && (
            <Button variant="outline" size="sm" onClick={onAutoGenerate} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-1" />
              {isGenerating ? "Generating..." : "Auto-Generate"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
          <Button
            size="sm"
            disabled={!canSignOff}
            onClick={() => onSignOff?.()}
            className={canSignOff ? "bg-status-healthy hover:bg-status-healthy/90" : ""}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Sign Off
          </Button>
        </div>
      </div>

      {/* Checklist Items grouped by category */}
      <div className="space-y-2">
        {categories.map((category) => {
          const categoryItems = filteredItems.filter((i) => i.category === category);
          if (categoryItems.length === 0) return null;
          return (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 mt-4">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <QAChecklistItem
                    key={item.id}
                    item={item}
                    onStatusChange={onStatusChange}
                    onNotesChange={onNotesChange}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No items match the current filters
        </div>
      )}

      <CreateQACheckDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => {
          onAddCheck(data);
          setCreateDialogOpen(false);
        }}
        isLoading={isLoading}
      />
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  valueClass?: string;
  children?: React.ReactNode;
}

function SummaryCard({ label, value, icon, valueClass, children }: SummaryCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 pb-2">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-semibold font-mono ${valueClass ?? ""}`}>
        {value}
      </div>
      {children}
    </div>
  );
}
