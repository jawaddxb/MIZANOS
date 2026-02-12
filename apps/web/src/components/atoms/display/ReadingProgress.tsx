"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@/lib/utils/cn";

interface ReadingProgressProps {
  className?: string;
}

function ReadingProgress({ className }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      setProgress(0);
      return;
    }
    setProgress(Math.min((scrollTop / docHeight) * 100, 100));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      className={cn("fixed top-0 left-0 z-50 h-0.5 w-full bg-muted", className)}
    >
      <div
        className="h-full bg-primary transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export { ReadingProgress };
export type { ReadingProgressProps };
