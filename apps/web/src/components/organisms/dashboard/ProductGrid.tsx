"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Clock, User, Code } from "lucide-react";
import type { Product } from "@/lib/types";

interface ProductGridProps {
  products: Product[];
}

const stageLabels: Record<string, string> = {
  intake: "Intake",
  development: "Development",
  qa: "QA",
  security: "Security Audit",
  deployment: "Deployment",
  complete: "Complete",
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className={cn(
            "group block relative overflow-hidden bg-card rounded-lg border border-l-[3px] p-4",
            "transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5",
          )}
        >
          <div className="relative">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-semibold text-foreground truncate group-hover:text-foreground/90 transition-colors">
                {product.name}
              </h3>
              <span className="text-lg font-mono font-bold text-foreground tabular-nums flex-shrink-0">
                {product.health_score ?? 0}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">
                  {stageLabels[(product.stage || "").toLowerCase()] || product.stage || "Unknown"}
                </span>
                <span className="font-mono text-foreground tabular-nums">{product.progress ?? 0}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${product.progress ?? 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <Clock className="h-3 w-3" />
              <span className="font-mono text-[11px]">
                {new Date(product.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
