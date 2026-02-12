"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  FileInput,
  Users,
  BookOpen,
  Shield,
  Settings,
  FlaskConical,
  LayoutTemplate,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/intake", icon: FileInput, label: "New Intake" },
  { href: "/team", icon: Users, label: "Team" },
  { href: "/knowledge", icon: BookOpen, label: "Knowledge Base" },
  { href: "/vault", icon: Shield, label: "Vault" },
  { href: "/evaluator", icon: FlaskConical, label: "Evaluator" },
  { href: "/templates", icon: LayoutTemplate, label: "Templates" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("px-3 py-2 relative z-10", collapsed && "px-2")}>
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href as Route}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
