"use client";

import { useState } from "react";

import { CheckCircle2, Circle, Rocket } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/display/Card";
import { Progress } from "@/components/atoms/feedback/Progress";

interface GoLiveChecklistProps {
  productId: string;
}

interface ChecklistItemState {
  id: string;
  label: string;
  category: string;
  checked: boolean;
}

const DEFAULT_ITEMS: Omit<ChecklistItemState, "checked">[] = [
  { id: "dns", label: "DNS configured and propagated", category: "Infrastructure" },
  { id: "ssl", label: "SSL certificates installed and valid", category: "Infrastructure" },
  { id: "monitoring", label: "Monitoring and alerting configured", category: "Infrastructure" },
  { id: "backup", label: "Backup strategy implemented and tested", category: "Infrastructure" },
  { id: "security", label: "Security review completed", category: "Security" },
  { id: "pentest", label: "Penetration testing passed", category: "Security" },
  { id: "perf", label: "Performance testing completed", category: "Quality" },
  { id: "load", label: "Load testing with expected traffic levels", category: "Quality" },
  { id: "staging", label: "Staging environment mirrors production", category: "Quality" },
  { id: "docs", label: "Documentation updated and reviewed", category: "Process" },
  { id: "runbook", label: "Runbook and incident response plan ready", category: "Process" },
  { id: "rollback", label: "Rollback plan documented", category: "Process" },
  { id: "signoff", label: "Stakeholder sign-off received", category: "Process" },
];

function useLocalChecklist(productId: string) {
  const storageKey = `go-live-checklist-${productId}`;

  const [items, setItems] = useState<ChecklistItemState[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_ITEMS.map((item) => ({ ...item, checked: false }));
    }
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, boolean>;
      return DEFAULT_ITEMS.map((item) => ({
        ...item,
        checked: parsed[item.id] ?? false,
      }));
    }
    return DEFAULT_ITEMS.map((item) => ({ ...item, checked: false }));
  });

  const toggle = (id: string) => {
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      );
      const checkedMap: Record<string, boolean> = {};
      for (const item of next) {
        checkedMap[item.id] = item.checked;
      }
      localStorage.setItem(storageKey, JSON.stringify(checkedMap));
      return next;
    });
  };

  return { items, toggle };
}

function GoLiveChecklist({ productId }: GoLiveChecklistProps) {
  const { items, toggle } = useLocalChecklist(productId);
  const checkedCount = items.filter((i) => i.checked).length;
  const progress = Math.round((checkedCount / items.length) * 100);

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          Go-Live Checklist
        </CardTitle>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm text-muted-foreground tabular-nums">
            {checkedCount}/{items.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {category}
            </h4>
            <div className="space-y-1">
              {items
                .filter((i) => i.category === category)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {item.checked ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        item.checked
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { GoLiveChecklist };
export type { GoLiveChecklistProps };
