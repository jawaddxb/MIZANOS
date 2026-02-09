"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "./useDebounce";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutosaveResult {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  save: () => void;
}

export function useAutosave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const debouncedData = useDebounce(data, delay);
  const initialRef = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }
    if (!enabled) return;

    let cancelled = false;
    setStatus("saving");

    onSave(debouncedData)
      .then(() => {
        if (!cancelled) {
          setStatus("saved");
          setLastSavedAt(new Date());
          setTimeout(() => {
            if (!cancelled) setStatus("idle");
          }, 2000);
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedData, onSave, enabled]);

  const save = useCallback(() => {
    setStatus("saving");
    onSave(dataRef.current)
      .then(() => {
        setStatus("saved");
        setLastSavedAt(new Date());
        setTimeout(() => setStatus("idle"), 2000);
      })
      .catch(() => setStatus("error"));
  }, [onSave]);

  return { status, lastSavedAt, save };
}
