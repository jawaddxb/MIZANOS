"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/atoms/layout/Accordion";
import { useProductDetail } from "@/hooks/queries/useProductDetail";
import type { ProductEnvironment } from "@/lib/types";
import { Train, Cloud, Rocket, CheckCircle2, Circle, ExternalLink } from "lucide-react";

interface DeploymentChecklistProps {
  productId: string;
}

interface ChecklistItemData {
  id: string;
  title: string;
  description?: string;
  isChecked: boolean;
}

const CATEGORIES = [
  { key: "railway", title: "Railway Deployment", icon: Train, description: "Infrastructure and deployment configuration" },
  { key: "cloudflare", title: "Cloudflare Configuration", icon: Cloud, description: "DNS, SSL, and security settings" },
  { key: "pre_launch", title: "Pre-Launch Verification", icon: Rocket, description: "Final checks before going live" },
] as const;

const DEFAULT_ITEMS: Record<string, ChecklistItemData[]> = {
  railway: [
    { id: "r-1", title: "railway.toml configured", isChecked: false },
    { id: "r-2", title: "Environment variables set", isChecked: false },
    { id: "r-3", title: "Build command verified", isChecked: false },
    { id: "r-4", title: "Health check endpoint active", isChecked: false },
  ],
  cloudflare: [
    { id: "c-1", title: "DNS records configured", isChecked: false },
    { id: "c-2", title: "SSL certificate active", isChecked: false },
    { id: "c-3", title: "Page rules set", isChecked: false },
  ],
  pre_launch: [
    { id: "p-1", title: "Staging tested and approved", isChecked: false },
    { id: "p-2", title: "Monitoring alerts configured", isChecked: false },
    { id: "p-3", title: "Rollback plan documented", isChecked: false },
    { id: "p-4", title: "Stakeholders notified", isChecked: false },
  ],
};

function ChecklistRow({ item, onToggle }: { item: ChecklistItemData; onToggle: () => void }) {
  return (
    <div className={`flex items-start gap-3 p-2 rounded-md transition-colors ${item.isChecked ? "bg-muted/50" : "hover:bg-muted/30"}`}>
      <button onClick={onToggle} className="mt-0.5 shrink-0">
        {item.isChecked
          ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          : <Circle className="h-5 w-5 text-muted-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.isChecked ? "line-through text-muted-foreground" : ""}`}>
          {item.title}
        </p>
        {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
      </div>
    </div>
  );
}

function EnvironmentCard({ env }: { env: ProductEnvironment }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div>
        <p className="text-sm font-medium capitalize">{env.environment_type}</p>
        <p className="text-xs text-muted-foreground">Branch: {env.branch ?? "main"} &bull; Status: {env.status}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={env.status === "active" ? "default" : "secondary"} className="text-xs">{env.status}</Badge>
        {env.url && (
          <a href={env.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-secondary">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}

function DeploymentChecklist({ productId }: DeploymentChecklistProps) {
  const { data, isLoading } = useProductDetail(productId);
  const [checklist, setChecklist] = useState(DEFAULT_ITEMS);

  const toggleItem = useCallback((catKey: string, itemId: string) => {
    setChecklist((prev) => ({
      ...prev,
      [catKey]: prev[catKey].map((item) =>
        item.id === itemId ? { ...item, isChecked: !item.isChecked } : item,
      ),
    }));
  }, []);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-48" /></div>;
  }

  const environments = data?.environments ?? [];

  return (
    <div className="space-y-6">
      {environments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Environments</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {environments.map((env) => <EnvironmentCard key={env.id} env={env} />)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4" /> Go-Live Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["railway"]} className="space-y-2">
            {CATEGORIES.map((cat) => {
              const items = checklist[cat.key] ?? [];
              const checkedCount = items.filter((i) => i.isChecked).length;
              const Icon = cat.icon;
              return (
                <AccordionItem key={cat.key} value={cat.key} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{cat.title}</div>
                        <div className="text-xs text-muted-foreground">{cat.description}</div>
                      </div>
                      <Badge variant={checkedCount === items.length ? "default" : "secondary"} className="ml-auto mr-2">
                        {checkedCount}/{items.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 py-2">
                      {items.map((item) => (
                        <ChecklistRow key={item.id} item={item} onToggle={() => toggleItem(cat.key, item.id)} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

export { DeploymentChecklist };
export type { DeploymentChecklistProps };
