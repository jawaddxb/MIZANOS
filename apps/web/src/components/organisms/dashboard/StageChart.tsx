"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/atoms/display/Card";
import { useDashboardMetrics } from "@/hooks/queries/useDashboardMetrics";
import { Loader2, TrendingUp } from "lucide-react";

interface StageData {
  stage: string;
  count: number;
}

interface StageChartProps {
  data?: StageData[];
}

const STAGE_BG: Record<string, string> = {
  Intake: "bg-pillar-business/20",
  Development: "bg-pillar-development/20",
  QA: "bg-pillar-product/20",
  Security: "bg-pillar-marketing/20",
  Deployment: "bg-pillar-marketing/20",
  Complete: "bg-status-healthy/20",
  Unknown: "bg-muted",
};

const STAGE_TEXT: Record<string, string> = {
  Intake: "text-pillar-business",
  Development: "text-pillar-development",
  QA: "text-pillar-product",
  Security: "text-pillar-marketing",
  Deployment: "text-pillar-marketing",
  Complete: "text-status-healthy",
  Unknown: "text-muted-foreground",
};

export function StageChart({ data: dataProp }: StageChartProps) {
  const { data: metrics, isLoading } = useDashboardMetrics();
  const data = dataProp ?? metrics?.stageDistribution ?? [];
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (isLoading && !dataProp) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Pipeline Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[130px] flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Pipeline Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[130px] flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Pipeline Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-[110px] w-[110px] relative flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              {data.reduce(
                (acc, item) => {
                  const pct = (item.count / total) * 100;
                  const gap = 2;
                  const el = (
                    <circle
                      key={item.stage}
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      strokeWidth="20"
                      stroke="currentColor"
                      className={STAGE_TEXT[item.stage] || STAGE_TEXT.Unknown}
                      strokeDasharray={`${pct * 3.14 - gap} ${314 - pct * 3.14 + gap}`}
                      strokeDashoffset={-acc.offset * 3.14}
                    />
                  );
                  acc.elements.push(el);
                  acc.offset += pct;
                  return acc;
                },
                { elements: [] as React.ReactNode[], offset: 0 },
              ).elements}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-lg font-bold font-mono">{total}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Total</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-1.5">
            {data.map((item, index) => (
              <div
                key={item.stage}
                className="flex items-center gap-2 text-xs"
                style={{ opacity: 0, animation: `fade-in 0.2s ease-out ${index * 50}ms forwards` }}
              >
                <div
                  className={cn(
                    "h-5 w-5 rounded flex items-center justify-center font-mono text-[10px] font-bold",
                    STAGE_BG[item.stage] || STAGE_BG.Unknown,
                    STAGE_TEXT[item.stage] || STAGE_TEXT.Unknown,
                  )}
                >
                  {item.count}
                </div>
                <span className="text-muted-foreground truncate">{item.stage}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
