"use client";

import * as React from "react";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils/cn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/layout/Tabs";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownInput({ value, onChange, className }: MarkdownInputProps) {
  const [activeTab, setActiveTab] = React.useState<"write" | "preview">("write");

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview")}>
        <div className="border-b bg-secondary/30 px-3">
          <TabsList className="h-10 bg-transparent">
            <TabsTrigger value="write" className="text-sm">Write</TabsTrigger>
            <TabsTrigger value="preview" className="text-sm">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="m-0">
          <BaseTextarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Paste or type your markdown specification here...\n\n# Product Overview\nDescribe the product in detail...\n\n## Core Features\n- Feature 1\n- Feature 2\n\n## Technical Requirements\n...`}
            className="min-h-[300px] resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0"
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="prose prose-sm min-h-[300px] max-w-none p-4">
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">Nothing to preview</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between border-t bg-secondary/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">Supports Markdown formatting</p>
        <p className="font-mono text-xs text-muted-foreground">{value.length} characters</p>
      </div>
    </div>
  );
}
