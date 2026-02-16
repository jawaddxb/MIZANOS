"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { PageHeader } from "@/components/molecules/layout/PageHeader";
import { ProductCard } from "@/components/molecules/product/ProductCard";
import { ProductTable } from "@/components/organisms/product/ProductTable";
import { ProductsFilterBar } from "@/components/organisms/dashboard/ProductsFilterBar";
import { useProducts } from "@/hooks/queries/useProducts";
import { cn } from "@/lib/utils/cn";
import {
  FolderKanban,
  Plus,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pillarFilter, setPillarFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: products = [], isLoading } = useProducts();

  const stages = [
    ...new Set(products.map((p) => p.stage).filter(Boolean)),
  ] as string[];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;
    const matchesPillar =
      pillarFilter === "all" || product.pillar === pillarFilter;
    const matchesStage =
      stageFilter === "all" || product.stage === stageFilter;
    return matchesSearch && matchesStatus && matchesPillar && matchesStage;
  });

  const hasActiveFilters =
    statusFilter !== "all" ||
    pillarFilter !== "all" ||
    stageFilter !== "all" ||
    searchQuery !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPillarFilter("all");
    setStageFilter("all");
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Products"
        subtitle="All projects across your organization"
        icon={<FolderKanban className="h-5 w-5 text-primary" />}
        badge={
          <Badge variant="secondary" className="font-mono text-xs">
            {filteredProducts.length}
            {filteredProducts.length !== products.length &&
              ` / ${products.length}`}
          </Badge>
        }
      >
        <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "h-7 w-7 transition-all",
              viewMode === "grid" && "shadow-sm",
            )}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "h-7 w-7 transition-all",
              viewMode === "list" && "shadow-sm",
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Link href="/intake">
          <Button className="shadow-sm hover:shadow-md transition-shadow">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </PageHeader>

      <ProductsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        pillarFilter={pillarFilter}
        onPillarChange={setPillarFilter}
        stageFilter={stageFilter}
        onStageChange={setStageFilter}
        stages={stages}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Loading projects...</p>
        </div>
      )}

      {!isLoading && filteredProducts.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!isLoading && filteredProducts.length > 0 && viewMode === "list" && (
        <ProductTable products={filteredProducts} />
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
            <FolderKanban className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {products.length > 0 ? "No matching projects" : "No projects yet"}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 max-w-sm">
            {products.length > 0
              ? "Try adjusting your search or filter criteria"
              : "Create your first project to get started with lifecycle management"}
          </p>
          {products.length > 0 ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Link href="/intake">
              <Button className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
