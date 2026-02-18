"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

interface TeamReadinessBannerProps {
  complete: boolean;
  missing: string[];
}

export function TeamReadinessBanner({ complete, missing }: TeamReadinessBannerProps) {
  if (complete) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">Team Ready</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
      <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
      <div>
        <span className="text-sm font-medium">Incomplete Team</span>
        <p className="text-xs mt-0.5">Missing: {missing.join(", ")}</p>
      </div>
    </div>
  );
}
