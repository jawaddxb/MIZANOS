import {
  LayoutDashboard,
  FileInput,
  FolderKanban,
  Users,
  Network,
  BookOpen,
  Shield,
  FlaskConical,
  LayoutTemplate,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "MAIN",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/products", icon: FolderKanban, label: "Products" },
      { href: "/intake", icon: FileInput, label: "New Intake" },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { href: "/team", icon: Users, label: "Team" },
      { href: "/org-chart", icon: Network, label: "Org Chart" },
      { href: "/knowledge", icon: BookOpen, label: "Knowledge Base" },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { href: "/vault", icon: Shield, label: "Vault" },
      { href: "/evaluator", icon: FlaskConical, label: "Evaluator" },
      { href: "/templates", icon: LayoutTemplate, label: "Templates" },
    ],
  },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  href: "/settings",
  icon: Settings,
  label: "Settings",
};
