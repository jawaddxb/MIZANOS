"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { KanbanFilters } from "./KanbanFilters";
import { COLUMN_DEFINITIONS, toKanbanTask } from "./kanban-utils";
import { AddTaskDialog } from "./AddTaskDialog";
import { EditTaskDialog } from "@/components/organisms/product/EditTaskDialog";
import { useTasks } from "@/hooks/queries/useTasks";
import { useProductMembers } from "@/hooks/queries/useProductMembers";
import {
  useCreateTask,
  useUpdateTask,
} from "@/hooks/mutations/useTaskMutations";
import type {
  KanbanTask,
  KanbanColumn as KanbanColumnType,
} from "@/lib/types";
import type { TaskStatus, PillarType, TaskPriority } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface KanbanBoardProps {
  productId: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KanbanBoard({ productId }: KanbanBoardProps) {
  const { data: rawTasks = [] } = useTasks(productId);
  const { data: members = [] } = useProductMembers(productId);

  const assigneeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      if (m.profile?.full_name) {
        map.set(m.profile_id, m.profile.full_name);
      }
    }
    return map;
  }, [members]);

  const kanbanTasks = useMemo(
    () => rawTasks.map((t) => toKanbanTask(t, assigneeMap)),
    [rawTasks, assigneeMap],
  );

  const [localTasks, setLocalTasks] = useState<KanbanTask[]>([]);
  const tasks = localTasks.length > 0 ? localTasks : kanbanTasks;

  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>("backlog");
  const [editTask, setEditTask] = useState<KanbanTask | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  /* Filters */
  const [search, setSearch] = useState("");
  const [filterPillar, setFilterPillar] = useState<PillarType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<
    TaskPriority | "all"
  >("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");

  const createTask = useCreateTask(productId);
  const updateTask = useUpdateTask(productId);

  /* Sensors */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  /* Sync local from server when server data changes */
  const prevRef = useMemo(() => kanbanTasks, [kanbanTasks]);
  if (prevRef !== kanbanTasks && localTasks.length > 0) {
    setLocalTasks([]);
  }

  /* Filtered tasks */
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (filterPillar !== "all" && t.pillar !== filterPillar) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority)
        return false;
      if (filterAssignee !== "all" && t.assigneeId !== filterAssignee)
        return false;
      return true;
    });
  }, [tasks, search, filterPillar, filterPriority, filterAssignee]);

  /* Build columns */
  const columns: KanbanColumnType[] = COLUMN_DEFINITIONS.map((col) => ({
    ...col,
    tasks: filtered.filter((t) => t.status === col.id),
  }));

  /* Find task by id */
  const findTask = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks],
  );

  /* DnD handlers */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = findTask(event.active.id as string);
      if (task) setActiveTask(task);
    },
    [findTask],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const isOverColumn = COLUMN_DEFINITIONS.some((c) => c.id === overId);
      if (isOverColumn) {
        setLocalTasks(
          (tasks.length ? tasks : kanbanTasks).map((t) =>
            t.id === activeId
              ? { ...t, status: overId as TaskStatus }
              : t,
          ),
        );
        return;
      }

      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        setLocalTasks(
          (tasks.length ? tasks : kanbanTasks).map((t) =>
            t.id === activeId ? { ...t, status: overTask.status } : t,
          ),
        );
      }
    },
    [tasks, kanbanTasks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;
      if (activeId === overId) return;

      const movedTask = findTask(activeId);
      if (movedTask) {
        updateTask.mutate(
          {
            id: activeId,
            status: movedTask.status,
            pillar: movedTask.pillar,
          },
          { onError: () => setLocalTasks([]) },
        );
      }

      /* Reorder within same column */
      const activeCol = tasks.find((t) => t.id === activeId)?.status;
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && activeCol === overTask.status) {
        const colTasks = tasks.filter((t) => t.status === activeCol);
        const oldIdx = colTasks.findIndex((t) => t.id === activeId);
        const newIdx = colTasks.findIndex((t) => t.id === overId);
        if (oldIdx !== newIdx) {
          const reordered = arrayMove(colTasks, oldIdx, newIdx);
          setLocalTasks([
            ...tasks.filter((t) => t.status !== activeCol),
            ...reordered,
          ]);
        }
      }
    },
    [findTask, tasks, updateTask],
  );

  /* Add task */
  const handleOpenAdd = (columnId: TaskStatus) => {
    setDialogStatus(columnId);
    setDialogOpen(true);
  };

  const handleCreate = (data: {
    title: string;
    description?: string;
    pillar: PillarType;
    priority: TaskPriority;
    status: TaskStatus;
    due_date?: string;
    assignee_id?: string;
  }) => {
    createTask.mutate(
      {
        title: data.title,
        description: data.description ?? null,
        pillar: data.pillar,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date ?? null,
        assignee_id: data.assignee_id ?? null,
      },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <KanbanFilters
        search={search}
        onSearchChange={setSearch}
        pillar={filterPillar}
        onPillarChange={setFilterPillar}
        priority={filterPriority}
        onPriorityChange={setFilterPriority}
        assignee={filterAssignee}
        onAssigneeChange={setFilterAssignee}
        productId={productId}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onAddTask={handleOpenAdd}
              onTaskClick={(task) => {
                setEditTask(task);
                setEditDialogOpen(true);
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <AddTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        defaultStatus={dialogStatus}
        isLoading={createTask.isPending}
        productId={productId}
      />

      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={editTask}
        productId={productId}
      />
    </div>
  );
}
