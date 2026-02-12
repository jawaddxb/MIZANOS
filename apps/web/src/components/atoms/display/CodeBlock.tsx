"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className={cn("group relative rounded-lg border bg-muted", className)}>
      {language && (
        <div className="flex items-center justify-between border-b px-4 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {language}
          </span>
        </div>
      )}
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-sm">
          <code className={cn("font-mono", language && `language-${language}`)}>
            {code}
          </code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "absolute right-2 top-2 rounded-md border bg-background p-1.5",
            "opacity-0 transition-opacity group-hover:opacity-100",
            "hover:bg-accent"
          )}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

export { CodeBlock };
export type { CodeBlockProps };
