"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";
import { useBreadcrumbs } from "@/hooks/utils/useBreadcrumbs";

export function BreadcrumbBar() {
  const items = useBreadcrumbs();

  if (items.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.href} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          )}
          {item.isActive ? (
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href as Route}
              className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
            >
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
