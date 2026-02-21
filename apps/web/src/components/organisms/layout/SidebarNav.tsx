"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Separator } from "@/components/atoms/layout/Separator";
import { NavGroup } from "@/components/molecules/navigation/NavGroup";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/feedback/Tooltip";
import { NAV_GROUPS, SETTINGS_NAV_ITEM } from "@/lib/constants";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const { isProjectManager } = useRoleVisibility();
  const settingsActive =
    pathname === SETTINGS_NAV_ITEM.href ||
    pathname.startsWith(SETTINGS_NAV_ITEM.href);

  const settingsLink = (
    <Link
      href={SETTINGS_NAV_ITEM.href as Route}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative",
        collapsed && "justify-center px-2",
        settingsActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-foreground/80 font-normal hover:bg-accent/50 hover:text-foreground",
      )}
    >
      {settingsActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
      )}
      <SETTINGS_NAV_ITEM.icon className="h-4 w-4 shrink-0" />
      {!collapsed && SETTINGS_NAV_ITEM.label}
    </Link>
  );

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

      {!isProjectManager && (
        <div className="mt-auto pt-4">
          <Separator className="mb-3 bg-border" />
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
              <TooltipContent side="right">
                {SETTINGS_NAV_ITEM.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            settingsLink
          )}
        </div>
      )}
    </nav>
  );
}
