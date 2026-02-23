"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/atoms/layout/Sheet";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { SelectField } from "@/components/molecules/forms/SelectField";
import { CommentThread } from "@/components/molecules/comments/CommentThread";
import { useProductMembers } from "@/hooks/queries/useProductMembers";
import { useUpdateTask } from "@/hooks/mutations/useTaskMutations";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";
import type { KanbanTask, TaskStatus, PillarType, TaskPriority } from "@/lib/types";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  pillar: z.enum(["business", "marketing", "development", "product"]),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["backlog", "in_progress", "review", "done", "live", "cancelled"] as const),
  due_date: z.string().optional(),
  assignee_id: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const PILLAR_OPTIONS = [
  { value: "business", label: "Business" },
  { value: "marketing", label: "Marketing" },
  { value: "development", label: "Development" },
  { value: "product", label: "Product" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "live", label: "Live" },
  { value: "cancelled", label: "Cancelled" },
];

interface TaskDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: KanbanTask | null;
  productId: string;
}

export function TaskDetailDrawer({
  open,
  onOpenChange,
  task,
  productId,
}: TaskDetailDrawerProps) {
  const { data: members = [] } = useProductMembers(productId);
  const updateTask = useUpdateTask(productId);
  const { isAdmin, isProjectManager } = useRoleVisibility();
  const canManageTasks = isAdmin || isProjectManager;

  const assigneeOptions = [
    { value: "__none__", label: "Unassigned" },
    ...members.map((m) => ({
      value: m.profile_id,
      label: `${m.profile?.full_name ?? m.profile?.email ?? "Unnamed"}${m.role ? ` — ${m.role}` : ""}`,
    })),
  ];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "", description: "", pillar: "development",
      priority: "medium", status: "backlog", due_date: "", assignee_id: "",
    },
  });

  useEffect(() => {
    if (task && open) {
      reset({
        title: task.title,
        description: task.description ?? "",
        pillar: task.pillar,
        priority: task.priority,
        status: task.status,
        due_date: task.dueDate?.slice(0, 10) ?? "",
        assignee_id: task.assigneeId ?? "__none__",
      });
    }
  }, [task, open, reset]);

  const onFormSubmit = (values: TaskFormValues) => {
    if (!task) return;
    const payload = canManageTasks
      ? {
          id: task.id,
          title: values.title,
          description: values.description ?? null,
          pillar: values.pillar,
          priority: values.priority,
          status: values.status,
          due_date: values.due_date || null,
          assignee_id: values.assignee_id === "__none__" ? null : (values.assignee_id ?? null),
        }
      : { id: task.id, status: values.status };
    updateTask.mutate(payload, { onSuccess: () => onOpenChange(false) });
  };

  const currentPillar = watch("pillar");
  const currentPriority = watch("priority");
  const currentStatus = watch("status");
  const currentAssignee = watch("assignee_id");
  const isUnassigned = !currentAssignee || currentAssignee === "__none__";
  const [assignWarning, setAssignWarning] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[600px] w-full flex flex-col p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>Task Details</SheetTitle>
          <SheetDescription className="sr-only">Edit task details and view comments</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
          <form id="task-detail-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-3">
            <div className="space-y-1">
              <BaseLabel htmlFor="drawer-title">Title</BaseLabel>
              <BaseInput id="drawer-title" {...register("title")} aria-invalid={!!errors.title} disabled={!canManageTasks} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1">
              <BaseLabel htmlFor="drawer-desc">Description</BaseLabel>
              <BaseTextarea id="drawer-desc" className="resize-y" rows={7} {...register("description")} disabled={!canManageTasks} />
            </div>

            {canManageTasks && (
              <SelectField
                label="Assignee"
                placeholder="Select assignee"
                options={assigneeOptions}
                value={currentAssignee || "__none__"}
                onValueChange={(v) => {
                  setValue("assignee_id", v);
                  if ((!v || v === "__none__") && currentStatus !== "backlog" && currentStatus !== "cancelled") {
                    setValue("status", "backlog");
                    setAssignWarning(true);
                    setTimeout(() => setAssignWarning(false), 3000);
                  }
                }}
              />
            )}

            <div className={canManageTasks ? "grid grid-cols-3 gap-3" : ""}>
              {canManageTasks && (
                <>
                  <SelectField label="Vertical" placeholder="Vertical" options={PILLAR_OPTIONS} value={currentPillar} onValueChange={(v) => setValue("pillar", v as PillarType)} />
                  <SelectField label="Priority" placeholder="Priority" options={PRIORITY_OPTIONS} value={currentPriority} onValueChange={(v) => setValue("priority", v as TaskPriority)} />
                </>
              )}
              <SelectField
                label="Status"
                placeholder="Status"
                options={STATUS_OPTIONS}
                value={currentStatus}
                onValueChange={(v) => {
                  if (isUnassigned && v !== "backlog" && v !== "cancelled") {
                    setAssignWarning(true);
                    setTimeout(() => setAssignWarning(false), 3000);
                    return;
                  }
                  setValue("status", v as TaskStatus);
                }}
              />
            </div>

            {assignWarning && (
              <p className="animate-in fade-in rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                Please assign this task before changing its status
              </p>
            )}

            {canManageTasks && (
              <div className="space-y-1">
                <BaseLabel htmlFor="drawer-due">Due Date</BaseLabel>
                <BaseInput id="drawer-due" type="date" {...register("due_date")} />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <BaseButton type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</BaseButton>
              <BaseButton type="submit" disabled={updateTask.isPending}>
                {updateTask.isPending ? "Saving..." : "Save"}
              </BaseButton>
            </div>
          </form>

          <div className="border-t pt-4">
            {task && <CommentThread taskId={task.id} productId={productId} />}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
