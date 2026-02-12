"use client";

import { useState } from "react";
import { Button } from "@/components/molecules/buttons/Button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/atoms/layout/Collapsible";
import { ChevronDown, Copy, Check, Terminal } from "lucide-react";
import { toast } from "sonner";

interface ClaudeCodePromptProps {
  prompt: string;
}

function ClaudeCodePrompt({ prompt }: ClaudeCodePromptProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="mt-3 rounded-md border border-border bg-muted/20">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-muted/40 transition-colors rounded-md"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Terminal className="h-3.5 w-3.5" />
              Claude Code Prompt
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border">
            <div className="flex justify-end px-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                leftIcon={
                  copied ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )
                }
                className="h-7 text-xs"
              >
                {copied ? "Copied" : "Copy to Claude"}
              </Button>
            </div>
            <pre className="px-3 pb-3 text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap font-mono max-h-80 overflow-y-auto">
              {prompt}
            </pre>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export { ClaudeCodePrompt };
export type { ClaudeCodePromptProps };
