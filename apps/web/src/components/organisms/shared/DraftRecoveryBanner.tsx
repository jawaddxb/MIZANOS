"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/molecules/buttons/Button";
import { FileWarning, X } from "lucide-react";

interface DraftRecoveryBannerProps {
  storageKey: string;
  onRecover: (data: string) => void;
  onDismiss: () => void;
}

function DraftRecoveryBanner({
  storageKey,
  onRecover,
  onDismiss,
}: DraftRecoveryBannerProps) {
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey);
    setHasDraft(!!saved);
  }, [storageKey]);

  if (!hasDraft) return null;

  const handleRecover = () => {
    const data = localStorage.getItem(storageKey);
    if (data) {
      onRecover(data);
    }
    localStorage.removeItem(storageKey);
    setHasDraft(false);
  };

  const handleDismiss = () => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    onDismiss();
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-3">
      <FileWarning className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
      <p className="text-sm text-yellow-800 dark:text-yellow-200 flex-1">
        You have an unsaved draft. Would you like to recover it?
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={handleRecover}>
          Recover
        </Button>
        <button
          onClick={handleDismiss}
          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
          aria-label="Dismiss draft recovery"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export { DraftRecoveryBanner };
export type { DraftRecoveryBannerProps };
