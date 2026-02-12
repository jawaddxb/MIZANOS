"use client";

import { useState } from "react";
import { LayoutGrid, List, Sparkles, FileText, LayoutTemplate, Loader2 } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/layout/DropdownMenu";
import { KanbanBoard } from "@/components/organisms/kanban/KanbanBoard";
import { TasksTab } from "@/components/organisms/product/TasksTab";
import {
  useGenerateTasksFromSpec,
  useGenerateTasksFromTemplates,
} from "@/hooks/mutations/useTaskGenerationMutations";
import { useGeneratePortTasks } from "@/hooks/mutations/usePortGenerator";
import { useProductDetail } from "@/hooks/queries/useProductDetail";

interface TasksViewToggleProps {
  productId: string;
}

export function TasksViewToggle({ productId }: TasksViewToggleProps) {
  const [view, setView] = useState<"board" | "list">("board");
  const { data: productData } = useProductDetail(productId);
  const generateFromSpec = useGenerateTasksFromSpec(productId);
  const generateFromTemplates = useGenerateTasksFromTemplates(productId);
  const generateFromPort = useGeneratePortTasks(productId);

  const isGenerating =
    generateFromSpec.isPending ||
    generateFromTemplates.isPending ||
    generateFromPort.isPending;

  const showLovable = productData?.product?.source_type?.includes("lovable");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={view === "board" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("board")}
            className="h-8 px-3"
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Board
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="h-8 px-3"
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Generate Tasks
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => generateFromSpec.mutate()}>
              <FileText className="h-4 w-4 mr-2" />
              From Specification
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generateFromTemplates.mutate()}>
              <LayoutTemplate className="h-4 w-4 mr-2" />
              From Templates
            </DropdownMenuItem>
            {showLovable && (
              <DropdownMenuItem onClick={() => generateFromPort.mutate(undefined)}>
                <Sparkles className="h-4 w-4 mr-2" />
                From Lovable Manifest
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {view === "board" ? (
        <KanbanBoard productId={productId} />
      ) : (
        <TasksTab productId={productId} />
      )}
    </div>
  );
}
