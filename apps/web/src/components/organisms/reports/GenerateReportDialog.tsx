"use client";

import { useState } from "react";
import { FileDown, FileText, Loader2, CheckCircle2, Bug, ClipboardList, SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/atoms/layout/Dialog";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";
import { Badge } from "@/components/atoms/display/Badge";
import { cn } from "@/lib/utils/cn";
import { reportsRepository } from "@/lib/api/repositories";
import { toast } from "sonner";
import type { ProjectReportBrief } from "@/lib/types";

type Format = "pdf" | "docx";
type ReportType = "general" | "bugs" | "custom";

const TASK_STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "live", label: "Live" },
  { value: "cancelled", label: "Cancelled" },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectReportBrief[];
}

export function GenerateReportDialog({ open, onOpenChange, projects }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generatingFormat, setGeneratingFormat] = useState<Format | null>(null);
  const [reportType, setReportType] = useState<ReportType>("general");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(["in_progress", "review"]));
  const [includeBugs, setIncludeBugs] = useState(false);

  const toggleProject = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(selected.size === projects.length ? new Set() : new Set(projects.map((p) => p.product_id)));
  };

  const handleGenerate = async (format: Format) => {
    if (selected.size === 0) { toast.error("Select at least one project"); return; }
    if (reportType === "custom" && selectedStatuses.size === 0) { toast.error("Select at least one task status"); return; }

    setGeneratingFormat(format);
    try {
      const ids = Array.from(selected);
      const statuses = reportType === "custom" ? Array.from(selectedStatuses) : undefined;
      const bugs = reportType === "custom" ? includeBugs : undefined;

      const blob = format === "pdf"
        ? await reportsRepository.generatePDF(ids, reportType, statuses, bugs)
        : await reportsRepository.generateDocument(ids, reportType, statuses, bugs);

      const ext = format === "pdf" ? "pdf" : "docx";
      const prefix = reportType === "bugs" ? "Bug_Report" : reportType === "custom" ? "Custom_Report" : "Project_Status_Update";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${prefix}_${new Date().toISOString().split("T")[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
      onOpenChange(false);
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGeneratingFormat(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Generate Report
          </DialogTitle>
          <DialogDescription>Select report type and projects to include.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 pb-1">
          {([
            { type: "general" as const, label: "General", icon: ClipboardList, activeClass: "bg-primary text-primary-foreground" },
            { type: "bugs" as const, label: "Bugs", icon: Bug, activeClass: "bg-red-600 text-white" },
            { type: "custom" as const, label: "Custom", icon: SlidersHorizontal, activeClass: "bg-violet-600 text-white" },
          ] as const).map(({ type, label, icon: Icon, activeClass }) => (
            <button
              key={type}
              type="button"
              onClick={() => setReportType(type)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                reportType === type ? activeClass : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {reportType === "custom" && (
          <div className="rounded-lg border p-3 space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground">Include tasks with status:</p>
            <div className="grid grid-cols-3 gap-2">
              {TASK_STATUS_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-xs cursor-pointer">
                  <BaseCheckbox
                    checked={selectedStatuses.has(value)}
                    onCheckedChange={() => toggleStatus(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="border-t pt-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <BaseCheckbox
                  checked={includeBugs}
                  onCheckedChange={() => setIncludeBugs((v) => !v)}
                />
                <Bug className="h-3 w-3 text-red-500" />
                Include Bugs
              </label>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <button type="button" onClick={selectAll} className="text-xs text-primary hover:underline">
            {selected.size === projects.length ? "Deselect All" : "Select All"}
          </button>
          <Badge variant="secondary" className="text-xs">{selected.size} / {projects.length} selected</Badge>
        </div>

        <ScrollArea className="max-h-[280px] -mx-1 px-1">
          <div className="space-y-1">
            {projects.map((p) => (
              <label key={p.product_id} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent/50 cursor-pointer transition-colors">
                <BaseCheckbox checked={selected.has(p.product_id)} onCheckedChange={() => toggleProject(p.product_id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.product_name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.stage || "—"} · {p.completed_tasks}/{p.total_tasks} tasks</p>
                </div>
                {selected.has(p.product_id) && <CheckCircle2 className="h-4 w-4 text-status-healthy flex-shrink-0" />}
              </label>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" onClick={() => onOpenChange(false)}>Cancel</BaseButton>
          <BaseButton onClick={() => handleGenerate("docx")} disabled={generatingFormat !== null || selected.size === 0}>
            {generatingFormat === "docx" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            .docx
          </BaseButton>
          <BaseButton onClick={() => handleGenerate("pdf")} disabled={generatingFormat !== null || selected.size === 0}>
            {generatingFormat === "pdf" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
            .pdf
          </BaseButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
