"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksRepository, type ChecklistItem } from "@/lib/api/repositories/tasks.repository";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/layout/Popover";
import { ListChecks, Plus, Trash2, UserPlus, Search, X } from "lucide-react";

interface TaskChecklistProps {
  taskId: string;
}

export function TaskChecklist({ taskId }: TaskChecklistProps) {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState<string | null>(null);
  const [newAssigneeName, setNewAssigneeName] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const { data: profiles = [] } = useProfiles();

  const { data: items = [] } = useQuery({
    queryKey: ["task-checklist", taskId],
    queryFn: () => tasksRepository.getChecklist(taskId),
    enabled: !!taskId,
  });

  const addItem = useMutation({
    mutationFn: (data: { title: string; assignee_id?: string | null }) =>
      tasksRepository.addChecklistItem(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-checklist", taskId] });
      queryClient.invalidateQueries({ queryKey: ["checklist-assignees"] });
      setNewTitle("");
      setNewAssigneeId(null);
      setNewAssigneeName("");
    },
  });

  const toggleItem = useMutation({
    mutationFn: (itemId: string) => tasksRepository.toggleChecklistItem(taskId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-checklist", taskId] }),
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<ChecklistItem> }) =>
      tasksRepository.updateChecklistItem(taskId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-checklist", taskId] });
      queryClient.invalidateQueries({ queryKey: ["checklist-assignees"] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => tasksRepository.deleteChecklistItem(taskId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-checklist", taskId] });
      queryClient.invalidateQueries({ queryKey: ["checklist-assignees"] });
    },
  });

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    addItem.mutate({ title, assignee_id: newAssigneeId });
  };

  const resetAdd = () => {
    setShowAdd(false);
    setNewTitle("");
    setNewAssigneeId(null);
    setNewAssigneeName("");
  };

  const checkedCount = items.filter((i) => i.is_checked).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          Checklist
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({checkedCount}/{items.length})
            </span>
          )}
        </h4>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Add Item
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(checkedCount / items.length) * 100}%` }}
          />
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            profiles={profiles}
            onToggle={() => toggleItem.mutate(item.id)}
            onAssign={(assigneeId) =>
              updateItem.mutate({ itemId: item.id, data: { assignee_id: assigneeId } })
            }
            onDelete={() => deleteItem.mutate(item.id)}
          />
        ))}
      </div>

      {showAdd && (
        <div className="space-y-2 rounded-md border p-2 bg-secondary/30">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
              if (e.key === "Escape") resetAdd();
            }}
            placeholder="What needs to be done?"
            className="w-full h-8 px-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <AssigneeSearchSelect
              profiles={profiles}
              selectedId={newAssigneeId}
              selectedName={newAssigneeName}
              onSelect={(id, name) => { setNewAssigneeId(id); setNewAssigneeName(name); }}
            />
            <button
              type="button"
              onClick={() => handleAdd()}
              disabled={!newTitle.trim() || addItem.isPending}
              className="shrink-0 px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {addItem.isPending ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={resetAdd}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AssigneeSearchSelect({
  profiles,
  selectedId,
  selectedName,
  onSelect,
}: {
  profiles: Array<{ id: string; full_name?: string | null; email?: string | null }>;
  selectedId: string | null;
  selectedName: string;
  onSelect: (id: string | null, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q),
    );
  }, [profiles, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 h-7 px-2 text-xs rounded-md border bg-background hover:bg-accent/50 flex-1 min-w-0 text-left"
        >
          <UserPlus className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {selectedId ? selectedName : "Assign to..."}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="flex items-center gap-2 px-2 py-1.5 border-b">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => { onSelect(null, ""); setOpen(false); setSearch(""); }}
            className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent"
          >
            No assignee
          </button>
          {filtered.map((p) => {
            const name = p.full_name ?? p.email ?? "Unknown";
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { onSelect(p.id, name); setOpen(false); setSearch(""); }}
                className={`w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent truncate ${selectedId === p.id ? "bg-accent font-medium" : ""}`}
              >
                {name}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No members found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ChecklistRow({
  item,
  profiles,
  onToggle,
  onAssign,
  onDelete,
}: {
  item: ChecklistItem;
  profiles: Array<{ id: string; full_name?: string | null; email?: string | null }>;
  onToggle: () => void;
  onAssign: (assigneeId: string | null) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 group rounded-md px-1 py-1 hover:bg-accent/50 transition-colors">
      <BaseCheckbox
        checked={item.is_checked}
        onCheckedChange={() => onToggle()}
      />
      <span className={`flex-1 text-sm ${item.is_checked ? "line-through text-muted-foreground" : ""}`}>
        {item.title}
      </span>

      {item.assignee_name && (
        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shrink-0">
          {item.assignee_name}
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <AssigneeSearchSelect
          profiles={profiles}
          selectedId={item.assignee_id}
          selectedName={item.assignee_name ?? ""}
          onSelect={(id) => onAssign(id)}
        />

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="p-1 rounded hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>
  );
}
