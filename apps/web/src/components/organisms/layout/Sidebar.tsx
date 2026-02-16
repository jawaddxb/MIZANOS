"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/molecules/buttons/Button";
import { MizanLogo } from "@/components/atoms/brand/MizanLogo";
import { SidebarNav } from "./SidebarNav";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/queries/useProducts";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/feedback/Tooltip";
import {
  FolderKanban,
  ChevronDown,
  Search,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeft,
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

  return (
    <aside
      className={cn(
        "h-full bg-background border-r border-border flex flex-col shrink-0 transition-all duration-300 ease-out relative overflow-hidden",
        collapsed ? "w-16" : "w-[272px]",
      )}
    >
      {/* Logo + Toggle */}
      <div
        className={cn(
          "p-4 border-b border-border transition-all duration-300 relative z-10",
          collapsed && "px-2 py-4",
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <MizanLogo size={18} className="text-primary-foreground" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <MizanLogo size={18} className="text-primary-foreground" />
              </div>
              <h1 className="text-base font-semibold text-foreground leading-tight">
                Mizan AI
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <SidebarNav collapsed={collapsed} />

      {/* Products Section */}
      <ProductsList
        collapsed={collapsed}
        products={products}
        productsExpanded={productsExpanded}
        onToggleExpanded={() => setProductsExpanded(!productsExpanded)}
        pathname={pathname}
      />

      {/* User Section */}
      <UserSection
        collapsed={collapsed}
        userInitials={userInitials}
        userName={user?.full_name}
        userEmail={user?.email}
        onSignOut={handleSignOut}
      />
    </aside>
  );
}

interface ProductsListProps {
  collapsed: boolean;
  products: { id: string; name: string; progress?: number | null }[];
  productsExpanded: boolean;
  onToggleExpanded: () => void;
  pathname: string;
}

function ProductsList({
  collapsed,
  products,
  productsExpanded,
  onToggleExpanded,
  pathname,
}: ProductsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = searchQuery
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products;

  const productsIcon = (
    <div
      className={cn(
        "flex items-center justify-center",
        collapsed && "px-2 py-2",
      )}
    >
      <FolderKanban className="h-4 w-4 text-muted-foreground" />
    </div>
  );

  if (collapsed) {
    return (
      <div className="px-2 py-2 relative z-10">
        <Tooltip>
          <TooltipTrigger asChild>{productsIcon}</TooltipTrigger>
          <TooltipContent side="right">
            Products ({products.length})
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col px-3 py-2 relative z-10">
      <button
        onClick={onToggleExpanded}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/30"
      >
        <span className="flex items-center gap-2">
          <FolderKanban className="h-3.5 w-3.5" />
          Products
          <span className="text-[10px] font-mono bg-accent px-1.5 py-0.5 rounded-md">
            {products.length}
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
        <>
          {/* Search within products — only shown when list is long */}
          {products.length > 5 && (
            <div className="relative mt-1.5 mb-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                placeholder="Filter products..."
                className="w-full pl-7 pr-7 h-7 text-xs rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
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
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      <span className="truncate flex-1">{product.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {product.progress ?? 0}%
                      </span>
                    </Link>
                  </li>
                );
              })}
              {filteredProducts.length === 0 && searchQuery && (
                <li className="px-3 py-4 text-center">
                  <p className="text-xs text-muted-foreground">No matching projects</p>
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

interface UserSectionProps {
  collapsed: boolean;
  userInitials: string;
  userName?: string | null;
  userEmail?: string | null;
  onSignOut: () => void;
}

function UserSection({
  collapsed,
  userInitials,
  userName,
  userEmail,
  onSignOut,
}: UserSectionProps) {
  const avatar = (
    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground shrink-0 cursor-default">
      {userInitials}
    </div>
  );

  return (
    <div
      className={cn(
        "p-3 border-t border-border bg-muted/30 relative z-10",
        collapsed && "p-2",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-2 py-1.5 rounded-lg",
          collapsed && "justify-center px-0",
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{avatar}</TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{userName ?? userEmail}</p>
              {userName && userEmail && (
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              )}
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            {avatar}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userName ?? userEmail}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
