"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/feedback/Tooltip";
import type { NavItem, NavGroup as NavGroupType } from "@/lib/constants";

interface NavGroupProps {
  group: NavGroupType;
  collapsed: boolean;
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href));

  const link = (
    <Link
      href={item.href as Route}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground font-normal hover:bg-accent/50 hover:text-foreground",
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
      )}
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && item.label}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function NavGroup({ group, collapsed }: NavGroupProps) {
  return (
    <div>
      {!collapsed && (
        <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {group.label}
        </p>
      )}
      <ul className="space-y-0.5">
        {group.items.map((item) => (
          <li key={item.href}>
            <NavLink item={item} collapsed={collapsed} />
          </li>
        ))}
      </ul>
    </div>
  );
}
