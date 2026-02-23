"use client";

import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { MessageSquareText } from "lucide-react";

interface CustomInstructionsBadgeProps {
  instructions: string;
  version: number;
}

export function CustomInstructionsBadge({
  instructions,
  version,
}: CustomInstructionsBadgeProps) {
  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <MessageSquareText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                Custom Instructions
              </span>
              <Badge variant="outline" className="text-xs">
                v{version}
              </Badge>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {instructions}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
