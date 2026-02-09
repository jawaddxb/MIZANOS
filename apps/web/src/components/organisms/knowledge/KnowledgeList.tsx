"use client";

import { useState } from "react";
import { Plus, Search, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { KnowledgeEntryCard } from "./KnowledgeEntryCard";
import { CreateKnowledgeEntryDialog } from "./CreateKnowledgeEntryDialog";
import { useKnowledgeEntries } from "@/hooks/queries/useKnowledgeEntries";
import { useProducts } from "@/hooks/queries/useProducts";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "bizdev", label: "BizDev" },
  { value: "product", label: "Product Features" },
  { value: "dev_knowledge", label: "Dev Knowledge" },
  { value: "general", label: "General" },
];

export function KnowledgeList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
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

      {/* Filters */}
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
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm w-full sm:w-[180px]"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm w-full sm:w-[200px]"
        >
          <option value="all">All Projects</option>
          <option value="general">General Only</option>
          {products?.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
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
          {filteredEntries?.map((entry) => (
            <KnowledgeEntryCard key={entry.id} entry={entry} />
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
