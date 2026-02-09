"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/atoms/layout/Tabs";

interface ProductTab {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface ProductDetailLayoutProps {
  title: string;
  subtitle?: string;
  tabs: ProductTab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
  headerActions?: ReactNode;
  className?: string;
}

function ProductDetailLayout({
  title,
  subtitle,
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  headerActions,
  className,
}: ProductDetailLayoutProps) {
  const resolvedDefault = defaultTab || tabs[0]?.value;

  return (
    <div className={cn("flex flex-col gap-6 p-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </div>

      <Tabs
        defaultValue={resolvedDefault}
        value={activeTab}
        onValueChange={onTabChange}
      >
        <TabsList className="w-full justify-start">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export { ProductDetailLayout };
export type { ProductDetailLayoutProps, ProductTab };
