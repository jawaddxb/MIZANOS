"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils/cn";

interface SkillTagProps {
  skill: string;
  onRemove?: () => void;
  className?: string;
}

const SkillTag = React.forwardRef<HTMLDivElement, SkillTagProps>(
  ({ skill, onRemove, className }, ref) => {
    return (
      <Badge
        ref={ref}
        variant="secondary"
        className={cn("gap-1 text-xs", className)}
      >
        {skill}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </Badge>
    );
  },
);
SkillTag.displayName = "SkillTag";

export { SkillTag };
export type { SkillTagProps };
