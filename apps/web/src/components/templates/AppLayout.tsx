"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface AppLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  className?: string;
}

function AppLayout({ sidebar, header, children, className }: AppLayoutProps) {
  return (
    <div className={cn("fixed inset-0 flex bg-background", className)}>
      {sidebar}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="h-14 shrink-0 border-b bg-background">
          {header}
        </header>
        <main className="min-h-0 flex-1 overflow-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}

export { AppLayout };
export type { AppLayoutProps };
