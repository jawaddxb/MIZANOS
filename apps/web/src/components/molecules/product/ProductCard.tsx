"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const progress = product.progress ?? 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group block bg-card rounded-lg border p-4",
        "transition-colors duration-150 hover:bg-accent/50",
      )}
    >
      <h3 className="text-sm font-medium text-foreground truncate mb-2">
        {product.name}
      </h3>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{product.stage || "No stage"}</span>
        <span className="font-mono tabular-nums">{progress}%</span>
      </div>
    </Link>
  );
}

export { ProductCard };
export type { ProductCardProps };
