"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/display/Card";
import { Palette } from "lucide-react";
import type { JsonValue } from "@/lib/types";

interface BrandIdentityPanelProps {
  branding: JsonValue | null;
  logoUrl: string | null;
}

interface BrandingData {
  colors?: string[];
  fonts?: string[];
  style?: string;
}

function parseBranding(branding: JsonValue | null): BrandingData {
  if (!branding || typeof branding !== "object" || Array.isArray(branding)) {
    return {};
  }
  const raw = branding as Record<string, unknown>;
  return {
    colors: Array.isArray(raw.colors) ? (raw.colors as string[]) : [],
    fonts: Array.isArray(raw.fonts) ? (raw.fonts as string[]) : [],
    style: typeof raw.style === "string" ? raw.style : undefined,
  };
}

function BrandIdentityPanel({ branding, logoUrl }: BrandIdentityPanelProps) {
  const data = parseBranding(branding);
  const hasContent = logoUrl || (data.colors && data.colors.length > 0);

  if (!hasContent) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center">
          <Palette className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No brand identity data available. Scrape a website to extract
            branding.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          Brand Identity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {logoUrl && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Logo
            </p>
            <img
              src={logoUrl}
              alt="Brand logo"
              className="max-h-16 rounded border bg-white p-1"
            />
          </div>
        )}

        {data.colors && data.colors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Colors
            </p>
            <div className="flex gap-2 flex-wrap">
              {data.colors.map((color) => (
                <div key={color} className="flex items-center gap-1.5">
                  <div
                    className="h-6 w-6 rounded border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-muted-foreground font-mono">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.fonts && data.fonts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Fonts
            </p>
            <div className="flex gap-2 flex-wrap">
              {data.fonts.map((font) => (
                <span
                  key={font}
                  className="text-xs bg-muted px-2 py-1 rounded"
                >
                  {font}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.style && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Style
            </p>
            <p className="text-sm text-foreground">{data.style}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { BrandIdentityPanel };
export type { BrandIdentityPanelProps };
