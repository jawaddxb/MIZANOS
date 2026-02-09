"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Progress } from "@/components/atoms/feedback/Progress";
import { Button } from "@/components/molecules/buttons/Button";
import { cn } from "@/lib/utils/cn";
import {
  CheckCircle2,
  XCircle,
  Circle,
  Filter,
  Plus,
  Sparkles,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useQAChecks } from "@/hooks/queries/useQAChecks";
import { useToggleQACheck, useCreateQACheck } from "@/hooks/mutations/useQAMutations";
import { CreateQACheckDialog } from "@/components/organisms/qa/CreateQACheckDialog";
import type { QACheck } from "@/lib/types";

export interface QATabProps {
  productId: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  passed: <CheckCircle2 className="h-4 w-4 text-status-healthy" />,
  failed: <XCircle className="h-4 w-4 text-status-critical" />,
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
};

export function QATab({ productId }: QATabProps) {
  const { data: items = [], isLoading } = useQAChecks(productId);
  const toggleCheck = useToggleQACheck(productId);
  const createCheck = useCreateQACheck(productId);
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const passedCount = items.filter((i: QACheck) => i.status === "passed").length;
  const failedCount = items.filter((i: QACheck) => i.status === "failed").length;
  const pendingCount = items.filter((i: QACheck) => i.status === "pending").length;
  const progressPct = items.length > 0 ? Math.round((passedCount / items.length) * 100) : 0;

  const filtered = items.filter((i: QACheck) => filter === "all" || i.status === filter);
  const categories = [...new Set(items.map((i: QACheck) => i.category))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Progress" value={`${progressPct}%`} showProgress progressValue={progressPct} />
        <StatCard title="Passed" value={passedCount} icon={<CheckCircle2 className="h-4 w-4 text-status-healthy" />} valueClass="text-status-healthy" />
        <StatCard title="Failed" value={failedCount} icon={<XCircle className="h-4 w-4 text-status-critical" />} valueClass="text-status-critical" />
        <StatCard title="Pending" value={pendingCount} icon={<Circle className="h-4 w-4" />} />
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {["all", "pending", "passed", "failed"].map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
      </div>

      {categories.map((cat) => {
        const catItems = filtered.filter((i: QACheck) => i.category === cat);
        if (catItems.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{cat}</h3>
            <div className="space-y-2">
              {catItems.map((item: QACheck) => (
                <QAItemRow key={item.id} item={item} onCycle={() => {
                  const next = item.status === "pending" ? "passed" : item.status === "passed" ? "failed" : "pending";
                  toggleCheck.mutate({ checkId: item.id, status: next });
                }} />
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {items.length === 0 ? "No QA checks yet. Add one to get started." : "No items match the current filter."}
        </div>
      )}

      <CreateQACheckDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(data) => {
          createCheck.mutate({ ...data, product_id: productId }, {
            onSuccess: () => setDialogOpen(false),
          });
        }}
      />
    </div>
  );
}

function StatCard({ title, value, icon, valueClass, showProgress, progressValue }: {
  title: string; value: string | number; icon?: React.ReactNode; valueClass?: string;
  showProgress?: boolean; progressValue?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-semibold font-mono", valueClass)}>{value}</div>
        {showProgress && <Progress value={progressValue} className="h-1.5 mt-2" />}
      </CardContent>
    </Card>
  );
}

function QAItemRow({ item, onCycle }: { item: QACheck; onCycle: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
      <button onClick={onCycle} className="flex-shrink-0 cursor-pointer">
        {STATUS_ICON[item.status ?? "pending"] || STATUS_ICON.pending}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
      </div>
      <Badge variant="outline" className="text-xs">{item.category}</Badge>
    </div>
  );
}
