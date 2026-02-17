"use client";

import Link from "next/link";
import { Badge } from "@/components/atoms/display/Badge";
import { PillarBadge } from "@/components/molecules/indicators/PillarBadge";
import { PRODUCT_STATUS_CONFIG } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/lib/types";

interface ProductRowProps {
  product: Product;
}

function getHealthColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
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

function ProductRow({ product }: ProductRowProps) {
  const statusConfig = product.status
    ? PRODUCT_STATUS_CONFIG[product.status]
    : null;
  const health = product.health_score ?? 0;
  const progress = product.progress ?? 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm",
        "transition-colors hover:bg-secondary/30",
      )}
    >
      <span className="flex-1 font-medium text-foreground truncate min-w-0">
        {product.name}
      </span>

      <span className="w-[90px] shrink-0">
        {statusConfig && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
            style={{ color: statusConfig.color, backgroundColor: statusConfig.bgColor }}
          >
            {statusConfig.label}
          </Badge>
        )}
      </span>

      <span className="w-[100px] shrink-0">
        {product.pillar && <PillarBadge pillar={product.pillar} className="text-[10px] px-1.5 py-0" />}
      </span>

      <span className="w-[90px] shrink-0 text-xs text-muted-foreground">
        {product.stage || "Unknown"}
      </span>

      <span className="w-[100px] shrink-0 flex items-center gap-2">
        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-mono tabular-nums w-[32px] text-right">
          {progress}%
        </span>
      </span>

      <span className={cn("w-[50px] shrink-0 text-xs font-bold tabular-nums text-right", getHealthColor(health))}>
        {health}
      </span>

      <span className="w-[60px] shrink-0 text-[11px] text-muted-foreground text-right">
        {formatRelativeTime(product.updated_at)}
      </span>
    </Link>
  );
}

export { ProductRow };
export type { ProductRowProps };
