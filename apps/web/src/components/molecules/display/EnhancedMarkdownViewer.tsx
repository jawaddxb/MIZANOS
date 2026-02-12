"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

import { cn } from "@/lib/utils/cn";
import { CodeBlock } from "@/components/atoms/display/CodeBlock";
import { Callout } from "@/components/atoms/display/Callout";
import { ReadingProgress } from "@/components/atoms/display/ReadingProgress";
import {
  TableOfContentsNav,
  type TocHeading,
} from "@/components/molecules/navigation/TableOfContentsNav";

interface EnhancedMarkdownViewerProps {
  content: string;
  showToc?: boolean;
  showProgress?: boolean;
  className?: string;
}

function parseHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`~]/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      headings.push({ id, text, level });
    }
  }
  return headings;
}

function useActiveHeading(headings: TocHeading[]): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>();

  const handleScroll = useCallback(() => {
    if (headings.length === 0) return;
    let current: string | undefined;
    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el && el.getBoundingClientRect().top <= 100) {
        current = heading.id;
      }
    }
    setActiveId(current);
  }, [headings]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return activeId;
}

function MarkdownComponents(): Components {
  return {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className ?? "");
      const codeString = String(children).replace(/\n$/, "");

      if (match) {
        return <CodeBlock code={codeString} language={match[1]} />;
      }

      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    blockquote({ children }) {
      const text = extractText(children);
      const calloutMatch = text.match(/^\[!(info|warning|error|tip)\]\s*/i);
      if (calloutMatch) {
        const type = calloutMatch[1].toLowerCase() as "info" | "warning" | "error" | "tip";
        return (
          <Callout type={type}>
            {text.replace(calloutMatch[0], "")}
          </Callout>
        );
      }
      return (
        <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground my-4">
          {children}
        </blockquote>
      );
    },
    h1({ children, ...props }) {
      const id = headingId(children);
      return <h1 id={id} className="text-3xl font-bold mt-8 mb-4 scroll-mt-20" {...props}>{children}</h1>;
    },
    h2({ children, ...props }) {
      const id = headingId(children);
      return <h2 id={id} className="text-2xl font-semibold mt-6 mb-3 scroll-mt-20" {...props}>{children}</h2>;
    },
    h3({ children, ...props }) {
      const id = headingId(children);
      return <h3 id={id} className="text-xl font-semibold mt-5 mb-2 scroll-mt-20" {...props}>{children}</h3>;
    },
    h4({ children, ...props }) {
      const id = headingId(children);
      return <h4 id={id} className="text-lg font-semibold mt-4 mb-2 scroll-mt-20" {...props}>{children}</h4>;
    },
    p({ children, ...props }) {
      return <p className="my-2 leading-7" {...props}>{children}</p>;
    },
    ul({ children, ...props }) {
      return <ul className="my-2 ml-6 list-disc space-y-1" {...props}>{children}</ul>;
    },
    ol({ children, ...props }) {
      return <ol className="my-2 ml-6 list-decimal space-y-1" {...props}>{children}</ol>;
    },
    table({ children, ...props }) {
      return (
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse border text-sm" {...props}>{children}</table>
        </div>
      );
    },
    th({ children, ...props }) {
      return <th className="border bg-muted px-3 py-2 text-left font-medium" {...props}>{children}</th>;
    },
    td({ children, ...props }) {
      return <td className="border px-3 py-2" {...props}>{children}</td>;
    },
    a({ children, href, ...props }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
          {...props}
        >
          {children}
        </a>
      );
    },
    hr() {
      return <hr className="my-6 border-border" />;
    },
  };
}

function headingId(children: React.ReactNode): string {
  return extractText(children)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;
    return extractText(element.props.children);
  }
  return "";
}

function EnhancedMarkdownViewer({
  content,
  showToc = false,
  showProgress = false,
  className,
}: EnhancedMarkdownViewerProps) {
  const headings = useMemo(() => parseHeadings(content), [content]);
  const activeId = useActiveHeading(headings);
  const components = useMemo(() => MarkdownComponents(), []);

  return (
    <>
      {showProgress && <ReadingProgress />}
      <div className={cn("flex gap-8", className)}>
        <div className="min-w-0 flex-1">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
          </ReactMarkdown>
        </div>
        {showToc && headings.length > 0 && (
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-16">
              <TableOfContentsNav headings={headings} activeId={activeId} />
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

export { EnhancedMarkdownViewer };
export type { EnhancedMarkdownViewerProps };
