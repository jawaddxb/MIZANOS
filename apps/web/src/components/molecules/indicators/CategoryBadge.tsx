"use client";

import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/atoms/display/Badge";
import { CATEGORY_COLOR_MAP, CATEGORY_LABEL_MAP } from "@/lib/constants/knowledge";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const colorInfo = CATEGORY_COLOR_MAP[category];
  const label = CATEGORY_LABEL_MAP[category] ?? category;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs border",
        colorInfo?.colorClasses,
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export { CategoryBadge };
export type { CategoryBadgeProps };
