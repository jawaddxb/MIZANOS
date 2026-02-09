"use client";

import { Button } from "@/components/molecules/buttons/Button";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  children?: React.ReactNode;
}

export function Header({ sidebarCollapsed = false, onToggleSidebar, children }: HeaderProps) {
  return (
    <header
      className={cn(
        "h-14 border-b flex items-center justify-between px-4 shrink-0 z-10 relative overflow-hidden",
        "bg-background",
      )}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: `
            linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 20%, transparent 40%, rgba(255,255,255,0.04) 60%, transparent 80%, rgba(255,255,255,0.03) 100%),
            linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.02) 100%)
          `,
        }}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="h-8 w-8 hover:bg-secondary relative z-10"
      >
        {sidebarCollapsed ? (
          <PanelLeft className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </Button>
      <div className="flex items-center gap-2 relative z-10">{children}</div>
    </header>
  );
}
