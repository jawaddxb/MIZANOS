"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/organisms/layout/Sidebar";
import { Header } from "@/components/organisms/layout/Header";
import { ThemeToggle } from "@/components/molecules/navigation/ThemeToggle";
import { NotificationDropdown } from "@/components/organisms/notifications/NotificationDropdown";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="fixed inset-0 bg-background flex overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        >
          <NotificationDropdown />
          <ThemeToggle />
        </Header>
        <main className="flex-1 overflow-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
