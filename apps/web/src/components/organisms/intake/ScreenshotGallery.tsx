"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/display/Card";
import { Image as ImageIcon } from "lucide-react";
import { ScreenshotLightbox } from "./ScreenshotLightbox";

interface ScreenshotGalleryProps {
  screenshots: string[] | null;
}

function ScreenshotGallery({ screenshots }: ScreenshotGalleryProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  if (!screenshots || screenshots.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center">
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No screenshots captured yet. Scrape a website to capture
            screenshots.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Screenshots ({screenshots.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {screenshots.map((src, index) => (
              <button
                key={`screenshot-${index}`}
                onClick={() => setLightboxSrc(src)}
                className="group relative aspect-video overflow-hidden rounded-lg border bg-muted hover:ring-2 hover:ring-primary transition-all"
              >
                <img
                  src={src}
                  alt={`Screenshot ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium transition-opacity">
                    View
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {lightboxSrc && (
        <ScreenshotLightbox
          src={lightboxSrc}
          open={!!lightboxSrc}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}

export { ScreenshotGallery };
export type { ScreenshotGalleryProps };
