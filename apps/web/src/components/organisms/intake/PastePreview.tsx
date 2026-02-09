"use client";

import * as React from "react";

import {
  FileJson,
  FileText,
  Table,
  Mail,
  Code,
  ListOrdered,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/atoms/display/Badge";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";

interface PastePreviewProps {
  content: string;
}

interface ContentFormat {
  type: "json" | "csv" | "markdown" | "email" | "code" | "list" | "plain";
  label: string;
  icon: React.ElementType;
  color: string;
}

function detectFormat(content: string): ContentFormat {
  const trimmed = content.trim();
  const lines = trimmed.split("\n").filter((l) => l.trim());

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return { type: "json", label: "JSON", icon: FileJson, color: "text-amber-600 bg-amber-100" };
    } catch {
      /* not valid JSON */
    }
  }

  if (lines.length > 1) {
    const commaCount = (lines[0].match(/,/g) || []).length;
    const tabCount = (lines[0].match(/\t/g) || []).length;
    if (commaCount >= 2 || tabCount >= 2) {
      const isConsistent = lines.slice(1, 5).every((line) => {
        const lc = (line.match(/,/g) || []).length;
        const lt = (line.match(/\t/g) || []).length;
        return Math.abs(lc - commaCount) <= 1 || Math.abs(lt - tabCount) <= 1;
      });
      if (isConsistent) {
        return { type: "csv", label: "Tabular Data", icon: Table, color: "text-emerald-600 bg-emerald-100" };
      }
    }
  }

  const emailPatterns = [/^(from|to|subject|date|cc|bcc):/im, /^on .+ wrote:$/im];
  if (emailPatterns.some((p) => p.test(trimmed))) {
    return { type: "email", label: "Email", icon: Mail, color: "text-blue-600 bg-blue-100" };
  }

  const mdPatterns = [/^#{1,6}\s+\S/m, /\[.+\]\(.+\)/, /^\s*[-*+]\s+\S/m, /```[\s\S]*```/];
  if (mdPatterns.filter((p) => p.test(trimmed)).length >= 2) {
    return { type: "markdown", label: "Markdown", icon: Hash, color: "text-violet-600 bg-violet-100" };
  }

  const codePatterns = [
    /^(import|export|const|let|var|function|class|def|async|await)\s/m,
    /[{}();]\s*$/m,
  ];
  if (codePatterns.some((p) => p.test(trimmed))) {
    return { type: "code", label: "Code", icon: Code, color: "text-orange-600 bg-orange-100" };
  }

  const listLines = lines.filter((l) => /^\s*[-*]\s+/.test(l) || /^\s*\d+[.)]\s+/.test(l));
  if (listLines.length >= 3 && listLines.length / lines.length > 0.5) {
    return { type: "list", label: "List", icon: ListOrdered, color: "text-cyan-600 bg-cyan-100" };
  }

  return { type: "plain", label: "Plain Text", icon: FileText, color: "text-muted-foreground bg-muted" };
}

function getContentStats(content: string) {
  const words = content.split(/\s+/).filter((w) => w.length > 0);
  const lineCount = content.split("\n").length;
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return { words: words.length, lines: lineCount, paragraphs: paragraphs.length };
}

export function PastePreview({ content }: PastePreviewProps) {
  const format = React.useMemo(() => detectFormat(content), [content]);
  const stats = React.useMemo(() => getContentStats(content), [content]);
  const FormatIcon = format.icon;

  if (!content.trim()) return null;

  const previewLines = content.split("\n").slice(0, 20);
  const totalLines = content.split("\n").length;

  return (
    <div className="mt-4 overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn("gap-1", format.color)}>
            <FormatIcon className="h-3 w-3" />
            {format.label}
          </Badge>
          <span className="text-xs text-muted-foreground">detected</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{stats.words} words</span>
          <span>{stats.lines} lines</span>
          <span>{stats.paragraphs} paragraphs</span>
        </div>
      </div>

      <ScrollArea className="h-[150px]">
        <div className="space-y-0.5 p-3 text-xs">
          {previewLines.map((line, i) => {
            let lineClass = "text-foreground";
            if (/^#{1,6}\s/.test(line)) lineClass = "font-semibold text-foreground";
            else if (/^\s*[-*]\s/.test(line)) lineClass = "text-muted-foreground";
            else if (/^(from|to|subject|date|cc|bcc):/i.test(line)) lineClass = "font-medium text-blue-600";

            return (
              <div key={i} className={cn("leading-relaxed", lineClass)}>
                {line || <span className="opacity-0">.</span>}
              </div>
            );
          })}
          {totalLines > 20 && (
            <p className="italic text-muted-foreground">+{totalLines - 20} more lines</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
