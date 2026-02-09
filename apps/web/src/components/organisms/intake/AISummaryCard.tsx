"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/display/Card";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Sparkles } from "lucide-react";
import type { JsonValue } from "@/lib/types";

interface AISummaryCardProps {
  summary: JsonValue | null;
  isLoading?: boolean;
}

function formatSummary(summary: JsonValue | null): string {
  if (!summary) return "";
  if (typeof summary === "string") return summary;
  if (typeof summary === "object" && summary !== null) {
    return JSON.stringify(summary, null, 2);
  }
  return String(summary);
}

function AISummaryCard({ summary, isLoading }: AISummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const text = formatSummary(summary);

  if (!text) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center">
          <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No AI summary available yet. Upload intake sources to generate one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {text}
        </p>
      </CardContent>
    </Card>
  );
}

export { AISummaryCard };
export type { AISummaryCardProps };
