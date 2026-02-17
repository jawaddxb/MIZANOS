"use client";

import { BreadcrumbBar } from "@/components/molecules/navigation/BreadcrumbBar";

interface HeaderProps {
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-4 shrink-0 z-10 bg-background">
      <BreadcrumbBar />
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
