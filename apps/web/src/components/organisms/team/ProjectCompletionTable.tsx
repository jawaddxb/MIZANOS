"use client";

import { cn } from "@/lib/utils/cn";
import type { ProjectCompletion } from "@/lib/types";

interface ProjectCompletionTableProps {
  completions: ProjectCompletion[];
}

function scoreColor(score: number): string {
  if (score >= 4) return "text-status-healthy";
  if (score >= 3) return "text-status-warning";
  return "text-status-critical";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ratingCell(value: number | null) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return <span className={cn("font-medium", scoreColor(value))}>{value.toFixed(1)}</span>;
}

export function ProjectCompletionTable({ completions }: ProjectCompletionTableProps) {
  if (completions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No project completions recorded yet</p>
      </div>
    );
  }

  const avgScore =
    completions.reduce((sum, c) => sum + c.score, 0) / completions.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          {completions.length} project{completions.length !== 1 ? "s" : ""} completed
        </span>
        <span className="text-muted-foreground">&middot;</span>
        <span>
          Avg Score:{" "}
          <span className={cn("font-semibold", scoreColor(avgScore))}>
            {avgScore.toFixed(1)}
          </span>
        </span>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-3 py-2 font-medium">Project</th>
              <th className="text-center px-2 py-2 font-medium">Score</th>
              <th className="text-center px-2 py-2 font-medium hidden sm:table-cell">
                Quality
              </th>
              <th className="text-center px-2 py-2 font-medium hidden sm:table-cell">
                Timeliness
              </th>
              <th className="text-center px-2 py-2 font-medium hidden sm:table-cell">
                Collab
              </th>
              <th className="text-right px-3 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {completions.map((c) => (
              <tr key={c.id} className="border-t hover:bg-secondary/25 transition-colors">
                <td className="px-3 py-2 font-medium truncate max-w-[200px]">
                  {c.product_name}
                </td>
                <td className="text-center px-2 py-2">
                  <span className={cn("font-semibold", scoreColor(c.score))}>
                    {c.score.toFixed(1)}
                  </span>
                </td>
                <td className="text-center px-2 py-2 hidden sm:table-cell">
                  {ratingCell(c.quality_rating)}
                </td>
                <td className="text-center px-2 py-2 hidden sm:table-cell">
                  {ratingCell(c.timeliness_rating)}
                </td>
                <td className="text-center px-2 py-2 hidden sm:table-cell">
                  {ratingCell(c.collaboration_rating)}
                </td>
                <td className="text-right px-3 py-2 text-muted-foreground">
                  {formatDate(c.completed_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
