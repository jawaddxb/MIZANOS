"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/molecules/buttons/Button";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { SidebarNav } from "./SidebarNav";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/queries/useProducts";
import {
  FolderKanban,
  ChevronDown,
  Search,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: products = [] } = useProducts();
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  const userInitials =
    user?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ||
    user?.email?.[0].toUpperCase() ||
    "U";

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <aside
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300 ease-out relative overflow-hidden",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: `
            linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.04) 25%, transparent 50%, rgba(255,255,255,0.03) 75%, transparent 100%),
            linear-gradient(-45deg, transparent 0%, rgba(255,255,255,0.02) 30%, transparent 60%)
          `,
        }}
      />

      {/* Logo */}
      <div
        className={cn(
          "p-4 border-b border-sidebar-border transition-all duration-300 relative z-10",
          collapsed && "px-2 py-4",
        )}
      >
        {collapsed ? (
          <div className="h-9 w-9 mx-auto rounded-xl bg-gradient-to-br from-white to-white/80 flex items-center justify-center shadow-sm">
            <span className="text-sidebar-background font-bold text-sm">M</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-white to-white/80 flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-sidebar-background font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-sidebar-foreground leading-tight">
                Mizan AI
              </h1>
              <p className="text-[11px] text-sidebar-foreground/60">Project Lifecycle</p>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3 pb-2 relative z-10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/50" />
            <BaseInput
              placeholder="Search..."
              className="pl-8 h-8 text-sm bg-white/5 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:bg-white/10 transition-colors"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      <SidebarNav collapsed={collapsed} />

      {/* Products Section */}
      <div
        className={cn(
          "flex-1 overflow-hidden flex flex-col px-3 py-2 relative z-10",
          collapsed && "px-2",
        )}
      >
        {!collapsed && (
          <>
            <button
              onClick={() => setProductsExpanded(!productsExpanded)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors rounded-lg hover:bg-sidebar-accent/30"
            >
              <span className="flex items-center gap-2">
                <FolderKanban className="h-3.5 w-3.5" />
                Products
                <span className="text-[10px] font-mono bg-sidebar-accent px-1.5 py-0.5 rounded-md">
                  {filteredProducts.length}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  productsExpanded ? "" : "-rotate-90",
                )}
              />
            </button>

            {productsExpanded && (
              <div className="flex-1 mt-1 overflow-y-auto">
                <ul className="space-y-0.5 pr-2">
                  {filteredProducts.map((product) => {
                    const isActive = pathname === `/products/${product.id}`;
                    return (
                      <li key={product.id}>
                        <Link
                          href={`/products/${product.id}`}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                          )}
                        >
                          <span className="truncate flex-1">{product.name}</span>
                          <span className="text-[10px] font-mono text-sidebar-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            {product.progress ?? 0}%
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                  {filteredProducts.length === 0 && searchQuery && (
                    <li className="px-3 py-4 text-center">
                      <p className="text-xs text-sidebar-foreground/50">No matching projects</p>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Section */}
      <div
        className={cn(
          "p-3 border-t border-sidebar-border bg-sidebar-accent/30 relative z-10",
          collapsed && "p-2",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 px-2 py-1.5 rounded-lg",
            collapsed && "justify-center px-0",
          )}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pillar-development to-pillar-development/80 flex items-center justify-center text-sm font-medium shrink-0 cursor-default shadow-sm">
            {userInitials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-[11px] text-sidebar-foreground/60 truncate">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-colors"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
