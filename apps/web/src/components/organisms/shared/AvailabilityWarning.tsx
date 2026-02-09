"use client";

import { AlertTriangle } from "lucide-react";

interface AvailabilityWarningProps {
  memberName: string;
  unavailableUntil: string;
}

function AvailabilityWarning({
  memberName,
  unavailableUntil,
}: AvailabilityWarningProps) {
  const formattedDate = new Date(unavailableUntil).toLocaleDateString();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-50 dark:bg-orange-950/20 px-4 py-3">
      <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
      <p className="text-sm text-orange-800 dark:text-orange-200">
        <span className="font-medium">{memberName}</span> is unavailable until{" "}
        <span className="font-medium tabular-nums">{formattedDate}</span>
      </p>
    </div>
  );
}

export { AvailabilityWarning };
export type { AvailabilityWarningProps };
