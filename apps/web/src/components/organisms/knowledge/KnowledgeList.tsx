"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { Badge } from "@/components/atoms/display/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";
import { KnowledgeEntryCard } from "./KnowledgeEntryCard";
import { KnowledgeCardSkeleton } from "./KnowledgeCardSkeleton";
import { CreateKnowledgeEntryDialog } from "./CreateKnowledgeEntryDialog";
import { useKnowledgeEntries } from "@/hooks/queries/useKnowledgeEntries";
import { useProducts } from "@/hooks/queries/useProducts";
import { KNOWLEDGE_CATEGORIES } from "@/lib/constants/knowledge";
import { cn } from "@/lib/utils/cn";

export function KnowledgeList() {
  const searchParams = useSearchParams();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") ?? "all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") ?? "");

  const { data: entries, isLoading } = useKnowledgeEntries({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    productId: projectFilter === "all" ? undefined : projectFilter,
  });
  const { data: products } = useProducts();

  const filteredEntries = entries?.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Knowledge Base</h1>
              {filteredEntries && (
                <Badge variant="secondary" className="text-xs">
                  {filteredEntries.length}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Centralized knowledge for the team
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Category chip filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            categoryFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted",
          )}
        >
          All
        </button>
        {KNOWLEDGE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              categoryFilter === cat.value
                ? cat.colorClasses
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search + project filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-md border bg-background pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="h-9 w-full sm:w-[200px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="general">General Only</SelectItem>
            {products?.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Entries List */}
      {isLoading ? (
        <KnowledgeCardSkeleton />
      ) : filteredEntries?.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No entries found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery
              ? "Try adjusting your search or filters"
              : "Add your first knowledge entry to get started"}
          </p>
          {!searchQuery && (
            <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries?.map((entry, index) => (
            <KnowledgeEntryCard
              key={entry.id}
              entry={entry}
              style={{ animationDelay: `${index * 50}ms` }}
            />
          ))}
        </div>
      )}

      <CreateKnowledgeEntryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
