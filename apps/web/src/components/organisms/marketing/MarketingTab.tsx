"use client";

import { useState } from "react";
import { Globe, Share2, Key, CheckSquare } from "lucide-react";
import type { MarketingDomain, MarketingSocialHandle, MarketingCredential, MarketingChecklistItem } from "@/lib/types/marketing";
import {
  useMarketingDomains,
  useMarketingSocialHandles,
  useMarketingCredentials,
  useMarketingChecklist,
} from "@/hooks/queries/useMarketingAssets";

interface MarketingTabProps {
  productId: string;
  canViewCredentials?: boolean;
}

const TABS = [
  { id: "domains", label: "Domains", icon: Globe },
  { id: "social", label: "Social Handles", icon: Share2 },
  { id: "credentials", label: "Credentials", icon: Key },
  { id: "checklist", label: "Checklist", icon: CheckSquare },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function MarketingTab({ productId, canViewCredentials = false }: MarketingTabProps) {
  const [activeTab, setActiveTab] = useState<TabId>("domains");
  const { data: domains, isLoading: domainsLoading } = useMarketingDomains(productId);
  const { data: socialHandles, isLoading: socialsLoading } = useMarketingSocialHandles(productId);
  const { data: credentials, isLoading: credentialsLoading } = useMarketingCredentials(productId);
  const { data: checklistItems, isLoading: checklistLoading } = useMarketingChecklist(productId);
  const isLoading = domainsLoading || socialsLoading || credentialsLoading || checklistLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Marketing Assets</h2>
        <p className="text-sm text-muted-foreground">
          Manage domains, social handles, credentials, and marketing checklist
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => {
          if (tab.id === "credentials" && !canViewCredentials) return null;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading marketing assets...</div>
      ) : (
        <div className="min-h-[200px]">
          {activeTab === "domains" && (
            <DomainsContent domains={domains ?? []} productId={productId} />
          )}
          {activeTab === "social" && (
            <SocialHandlesContent handles={socialHandles ?? []} productId={productId} />
          )}
          {activeTab === "credentials" && canViewCredentials && (
            <CredentialsContent credentials={credentials ?? []} productId={productId} />
          )}
          {activeTab === "checklist" && (
            <ChecklistContent items={checklistItems ?? []} productId={productId} />
          )}
        </div>
      )}
    </div>
  );
}

function DomainsContent({ domains, productId }: { domains: MarketingDomain[]; productId: string }) {
  if (domains.length === 0) {
    return <EmptyState message="No domains configured" />;
  }
  return (
    <div className="space-y-3">
      {domains.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{d.domain_name}</span>
          </div>
          <span className="text-xs text-muted-foreground capitalize">{d.ssl_status ?? "unknown"}</span>
        </div>
      ))}
    </div>
  );
}

function SocialHandlesContent({ handles, productId }: { handles: MarketingSocialHandle[]; productId: string }) {
  if (handles.length === 0) {
    return <EmptyState message="No social handles added" />;
  }
  return (
    <div className="space-y-3">
      {handles.map((h) => (
        <div key={h.id} className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm capitalize">{h.platform}</span>
          <span className="text-sm font-mono">{h.handle}</span>
        </div>
      ))}
    </div>
  );
}

function CredentialsContent({ credentials, productId }: { credentials: MarketingCredential[]; productId: string }) {
  if (credentials.length === 0) {
    return <EmptyState message="No marketing credentials" />;
  }
  return (
    <div className="space-y-3">
      {credentials.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
          <span className="font-medium">{c.label}</span>
          <span className="text-xs text-muted-foreground capitalize">{c.credential_type}</span>
        </div>
      ))}
    </div>
  );
}

function ChecklistContent({ items, productId }: { items: MarketingChecklistItem[]; productId: string }) {
  if (items.length === 0) {
    return <EmptyState message="No checklist items" />;
  }
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
          <div className={`h-4 w-4 rounded border ${item.is_completed ? "bg-primary border-primary" : "border-muted-foreground"}`} />
          <span className={item.is_completed ? "line-through text-muted-foreground" : ""}>{item.title}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">{message}</div>
  );
}
