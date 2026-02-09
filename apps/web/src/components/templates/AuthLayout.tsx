"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
}

function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-background px-4",
        className,
      )}
    >
      <div className="w-full max-w-md space-y-6">{children}</div>
    </div>
  );
}

export { AuthLayout };
export type { AuthLayoutProps };
