"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/atoms/layout/Tabs";
import {
  Globe,
  Share2,
  Key,
  CheckSquare,
  Plus,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  useMarketingDomains,
  useMarketingSocialHandles,
  useMarketingChecklist,
} from "@/hooks/queries/useMarketingAssets";
import type {
  MarketingDomain,
  MarketingSocialHandle,
  MarketingChecklistItem,
} from "@/lib/types";

export interface MarketingTabWrapperProps {
  productId: string;
}

export function MarketingTabWrapper({ productId }: MarketingTabWrapperProps) {
  const { data: domains = [], isLoading: domainsLoading } = useMarketingDomains(productId);
  const { data: socialHandles = [], isLoading: socialLoading } = useMarketingSocialHandles(productId);
  const { data: checklistItems = [], isLoading: checklistLoading } = useMarketingChecklist(productId);
  const isLoading = domainsLoading || socialLoading || checklistLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Marketing Assets</h2>
        <p className="text-sm text-muted-foreground">
          Manage domains, social handles, credentials, and marketing checklist
        </p>
      </div>

      <Tabs defaultValue="domains" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="domains" className="gap-2">
            <Globe className="h-4 w-4" /> Domains
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="h-4 w-4" /> Social Handles
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-2">
            <CheckSquare className="h-4 w-4" /> Checklist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="domains">
          <DomainsSection items={domains} />
        </TabsContent>
        <TabsContent value="social">
          <SocialSection items={socialHandles} />
        </TabsContent>
        <TabsContent value="checklist">
          <ChecklistSection items={checklistItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DomainsSection({ items }: { items: MarketingDomain[] }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Domains</h3>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Add Domain</Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Globe className="h-8 w-8" />} message="No domains configured" />
      ) : (
        items.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{d.domain_name}</span>
              {d.registrar && <Badge variant="outline" className="text-xs">{d.registrar}</Badge>}
              <span className="ml-auto">
                <Badge variant={d.ssl_status === "active" ? "default" : "secondary"} className="text-xs">
                  {d.ssl_status || "pending"}
                </Badge>
              </span>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function SocialSection({ items }: { items: MarketingSocialHandle[] }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Social Handles</h3>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Add Handle</Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Share2 className="h-8 w-8" />} message="No social handles configured" />
      ) : (
        items.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">{s.platform}</Badge>
              <span className="text-sm">{s.handle}</span>
              {s.profile_url && (
                <a href={s.profile_url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </a>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function ChecklistSection({ items }: { items: MarketingChecklistItem[] }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Marketing Checklist</h3>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<CheckSquare className="h-8 w-8" />} message="No checklist items yet" />
      ) : (
        items.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border">
            <input type="checkbox" checked={c.is_completed ?? false} readOnly className="rounded" />
            <span className="text-sm">{c.title}</span>
          </div>
        ))
      )}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      {icon}
      <p className="text-sm mt-2">{message}</p>
    </div>
  );
}
