"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/atoms/layout/Tabs";

interface TabNavItem {
  value: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabNavProps {
  items: TabNavItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
}

function TabNav({
  items,
  defaultValue,
  value,
  onValueChange,
  className,
  listClassName,
}: TabNavProps) {
  const resolvedDefault = defaultValue || items[0]?.value;

  return (
    <Tabs
      defaultValue={resolvedDefault}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsList className={cn("w-full justify-start", listClassName)}>
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { TabNav };
export type { TabNavProps, TabNavItem };
