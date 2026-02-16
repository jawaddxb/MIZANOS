"use client";

import Link from "next/link";
import { Badge } from "@/components/atoms/display/Badge";
import { PillarBadge } from "@/components/molecules/indicators/PillarBadge";
import { PILLAR_CONFIG } from "@/lib/constants/pillars";
import { PRODUCT_STATUS_CONFIG } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

function getHealthColor(score: number): string {
  if (score >= 70) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 40) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function ProductCard({ product }: ProductCardProps) {
  const pillarKey = product.pillar as keyof typeof PILLAR_CONFIG | null;
  const pillarConfig = pillarKey ? PILLAR_CONFIG[pillarKey] : null;
  const statusConfig = product.status
    ? PRODUCT_STATUS_CONFIG[product.status]
    : null;
  const health = product.health_score ?? 0;
  const progress = product.progress ?? 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group block relative overflow-hidden bg-card rounded-lg border p-4",
        "transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5",
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: pillarConfig?.borderColor }}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {product.name}
        </h3>
        <span
          className={cn(
            "text-xs font-bold tabular-nums rounded-full px-2 py-0.5 border flex-shrink-0",
            getHealthColor(health),
          )}
        >
          {health}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {statusConfig && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
            style={{ color: statusConfig.color, backgroundColor: statusConfig.bgColor }}
          >
            {statusConfig.label}
          </Badge>
        )}
        {product.pillar && <PillarBadge pillar={product.pillar} className="text-[10px] px-1.5 py-0" />}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground font-medium">
            {product.stage || "Unknown"}
          </span>
          <span className="font-mono text-foreground tabular-nums">
            {progress}%
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Updated {formatRelativeTime(product.updated_at)}
      </p>
    </Link>
  );
}

export { ProductCard };
export type { ProductCardProps };
