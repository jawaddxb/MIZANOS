"use client";

import { useState, useMemo } from "react";
import { Search, Library, Package } from "lucide-react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";
import {
  useReusableLibrary,
  type ReusableFeatureWithProduct,
} from "@/hooks/queries/useReusableFeatures";
import { AddToLibraryDialog } from "./AddToLibraryDialog";

const CATEGORIES = [
  "all",
  "authentication",
  "payments",
  "notifications",
  "analytics",
  "ui",
  "integration",
  "other",
] as const;

function FeatureCard({ feature }: { feature: ReusableFeatureWithProduct }) {
  return (
    <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-foreground text-sm">{feature.name}</h4>
        {feature.reusable_category && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {feature.reusable_category}
          </Badge>
        )}
      </div>
      {feature.description && (
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {feature.description}
        </p>
      )}
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Package className="h-3 w-3" />
          {feature.product_name}
        </span>
        {feature.import_count > 0 && (
          <span>Imported {feature.import_count}x</span>
        )}
      </div>
    </div>
  );
}

export function ComponentLibraryTab() {
  const { data: features = [], isLoading } = useReusableLibrary();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    return features.filter((f) => {
      const matchesSearch =
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        category === "all" || f.reusable_category === category;
      return matchesSearch && matchesCategory;
    });
  }, [features, search, category]);

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Component Library</h3>
              <p className="text-sm text-muted-foreground">
                Reusable specification features across products
              </p>
            </div>
          </div>
          <AddToLibraryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <BaseInput
              placeholder="Search features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all"
                    ? "All Categories"
                    : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No reusable features found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
