"use client";

import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/display/Card";

interface ProductCardProps {
  id: string;
  name: string;
  status: string;
  progress: number;
  className?: string;
  onClick?: () => void;
}

function ProductCard({
  name,
  status,
  progress,
  className,
  onClick,
}: ProductCardProps) {
  return (
    <Card
      className={cn("cursor-pointer transition-shadow hover:shadow-md", className)}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="capitalize">{status.replace("_", " ")}</span>
          <span className="font-mono">{progress}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

export { ProductCard };
export type { ProductCardProps };
