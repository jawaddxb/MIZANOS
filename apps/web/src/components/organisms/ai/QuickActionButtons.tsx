"use client";

import {
  FileText,
  AlertTriangle,
  BarChart3,
  CheckSquare,
  GitBranch,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/molecules/buttons/Button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickAction {
  label: string;
  prompt: string;
  icon: LucideIcon;
}

interface QuickActionButtonsProps {
  onAction: (action: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Summarize",
    prompt:
      "Give me a brief summary of this project - what it is, current status, and key metrics.",
    icon: FileText,
  },
  {
    label: "Risk Analysis",
    prompt:
      "Analyze the current risks for this project. What are the main concerns and what should we prioritize?",
    icon: AlertTriangle,
  },
  {
    label: "Progress",
    prompt:
      "What's our current progress? Are we on track for launch? What's blocking us?",
    icon: BarChart3,
  },
  {
    label: "Tasks",
    prompt:
      "What are the most important tasks right now? What's overdue or high priority?",
    icon: CheckSquare,
  },
  {
    label: "Code Health",
    prompt:
      "How's our code health? What did the latest audit show? Any critical issues?",
    icon: GitBranch,
  },
  {
    label: "Launch Ready",
    prompt:
      "Are we ready for launch? What's left on the deployment checklist? What's blocking go-live?",
    icon: Zap,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickActionButtons({
  onAction,
  disabled,
  compact,
}: QuickActionButtonsProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {QUICK_ACTIONS.slice(0, 4).map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            size="sm"
            onClick={() => onAction(action.prompt)}
            disabled={disabled}
            className="h-7 text-xs px-2"
          >
            <action.icon className="h-3 w-3 mr-1" />
            {action.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {QUICK_ACTIONS.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          size="sm"
          onClick={() => onAction(action.prompt)}
          disabled={disabled}
          className="h-auto py-2 px-3 flex flex-col items-center gap-1 text-xs"
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
