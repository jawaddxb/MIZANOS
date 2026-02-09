"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Circle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/molecules/buttons/Button";
import type { QACheck } from "@/lib/types/qa";

type CheckStatus = "pending" | "passed" | "failed";

interface QAChecklistItemProps {
  item: QACheck;
  onStatusChange: (id: string, status: CheckStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
}

const statusConfig: Record<CheckStatus, { icon: typeof Circle; cls: string; label: string }> = {
  pending: { icon: Circle, cls: "text-muted-foreground", label: "Pending" },
  passed: { icon: CheckCircle2, cls: "text-status-healthy", label: "Passed" },
  failed: { icon: XCircle, cls: "text-status-critical", label: "Failed" },
};

export function QAChecklistItem({ item, onStatusChange, onNotesChange }: QAChecklistItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(!!item.notes);
  const config = statusConfig[item.status as CheckStatus] ?? statusConfig.pending;
  const StatusIcon = config.icon;

  const cycleStatus = () => {
    const next: Record<CheckStatus, CheckStatus> = {
      pending: "passed",
      passed: "failed",
      failed: "pending",
    };
    onStatusChange(item.id, next[item.status as CheckStatus] ?? "pending");
  };

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-colors",
        item.status === "failed" && "border-status-critical/30 bg-status-critical/5",
        item.status === "passed" && "border-status-healthy/30",
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={cycleStatus}
          className={cn(
            "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors",
            item.status === "pending" && "hover:bg-secondary",
            item.status === "passed" && "bg-status-healthy/10",
            item.status === "failed" && "bg-status-critical/10",
          )}
        >
          <StatusIcon className={cn("h-5 w-5", config.cls)} />
        </button>

        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "text-sm font-medium",
              item.status === "passed" && "text-muted-foreground line-through",
            )}
          >
            {item.title}
          </h4>
          {item.description && !expanded && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {item.notes && (
            <div className="h-6 w-6 rounded bg-secondary flex items-center justify-center">
              <MessageSquare className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t bg-secondary/20">
          {item.description && (
            <p className="text-sm text-muted-foreground mb-3 pt-3">{item.description}</p>
          )}

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">Status:</span>
            {(["pending", "passed", "failed"] as CheckStatus[]).map((status) => {
              const cfg = statusConfig[status];
              const Icon = cfg.icon;
              return (
                <Button
                  key={status}
                  variant={item.status === status ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 text-xs",
                    item.status === status && status === "passed" && "bg-status-healthy hover:bg-status-healthy/90",
                    item.status === status && status === "failed" && "bg-status-critical hover:bg-status-critical/90",
                  )}
                  onClick={() => onStatusChange(item.id, status)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {cfg.label}
                </Button>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Notes</span>
              {!showNotes && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowNotes(true)}>
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Add Note
                </Button>
              )}
            </div>
            {showNotes && (
              <textarea
                value={item.notes ?? ""}
                onChange={(e) => onNotesChange(item.id, e.target.value)}
                placeholder="Add notes about this check..."
                className="w-full min-h-[60px] rounded-md border bg-background px-3 py-2 text-sm"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
