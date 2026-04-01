"use client";

import { cn } from "@/lib/utils/cn";
import { NavGroup } from "@/components/molecules/navigation/NavGroup";
import { NAV_GROUPS } from "@/lib/constants";

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const visibleGroups = NAV_GROUPS;

  return (
    <nav
      className={cn(
        "flex flex-col flex-1 px-3 py-2 relative z-10",
        collapsed && "px-2",
      )}
    >
      <div className="space-y-5">
        {visibleGroups.map((group) => (
          <NavGroup key={group.label} group={group} collapsed={collapsed} />
        ))}
      </div>
    </nav>
  );
}
