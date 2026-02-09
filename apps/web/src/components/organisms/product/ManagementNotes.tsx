"use client";

import { useState } from "react";

import { Plus, Trash2, Pin, PinOff, Lock } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/display/Card";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { useManagementNotes, useManagementNoteMutations } from "@/hooks/queries/useManagementNotes";
import { AddNoteDialog, type NoteFormData } from "./AddNoteDialog";

interface ManagementNotesProps {
  productId: string;
  authorId: string;
}

interface ManagementNote {
  id: string;
  product_id: string;
  author_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

function ManagementNotes({ productId, authorId }: ManagementNotesProps) {
  const { data: notes = [], isLoading } = useManagementNotes(productId);
  const { createNote, deleteNote, togglePin } =
    useManagementNoteMutations(productId);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdd = (data: NoteFormData) => {
    createNote.mutate(
      { product_id: productId, author_id: authorId, content: data.content },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Management Notes ({notes.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {sortedNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No management notes yet. These are internal and not visible to
              partners.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedNotes.map((note: ManagementNote) => (
                <div
                  key={note.id}
                  className={`rounded-lg border p-3 ${
                    note.is_pinned ? "border-primary/30 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePin.mutate(note.id)}
                      >
                        {note.is_pinned ? (
                          <PinOff className="h-3.5 w-3.5" />
                        ) : (
                          <Pin className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote.mutate(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddNoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type="management"
        onSubmit={handleAdd}
        isSubmitting={createNote.isPending}
      />
    </>
  );
}

export { ManagementNotes };
export type { ManagementNotesProps };
