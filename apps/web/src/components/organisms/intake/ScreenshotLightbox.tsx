"use client";

import { useEffect, useCallback } from "react";

import { X } from "lucide-react";

interface ScreenshotLightboxProps {
  src: string;
  open: boolean;
  onClose: () => void;
}

function ScreenshotLightbox({ src, open, onClose }: ScreenshotLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-white/80 transition-colors"
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={src}
        alt="Screenshot preview"
        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export { ScreenshotLightbox };
export type { ScreenshotLightboxProps };
