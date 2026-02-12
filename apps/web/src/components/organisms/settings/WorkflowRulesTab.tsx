"use client";

import Link from "next/link";
import { ExternalLink, LayoutTemplate } from "lucide-react";
import { Card } from "@/components/atoms/display/Card";

export function WorkflowRulesTab() {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Workflow Templates</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Manage multi-step workflow templates for each project source type.
        </p>
        <Link
          href="/templates"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Go to Templates
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
