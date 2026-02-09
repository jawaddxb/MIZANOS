"use client";

import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/atoms/display/Badge";

type PillarType =
  | "development"
  | "design"
  | "marketing"
  | "management"
  | "qa"
  | "compliance";

interface PillarBadgeProps {
  pillar: string;
  className?: string;
}

const PILLAR_CLASSES: Record<string, string> = {
  development: "bg-pillar-development text-pillar-development-foreground",
  design: "bg-pillar-design text-pillar-design-foreground",
  marketing: "bg-pillar-marketing text-pillar-marketing-foreground",
  management: "bg-pillar-management text-pillar-management-foreground",
  qa: "bg-pillar-qa text-pillar-qa-foreground",
  compliance: "bg-pillar-compliance text-pillar-compliance-foreground",
};

function PillarBadge({ pillar, className }: PillarBadgeProps) {
  const pillarClass = PILLAR_CLASSES[pillar] || "";

  return (
    <Badge
      variant="default"
      className={cn("border-none", pillarClass, className)}
    >
      {pillar.charAt(0).toUpperCase() + pillar.slice(1)}
    </Badge>
  );
}

export { PillarBadge };
export type { PillarBadgeProps, PillarType };
