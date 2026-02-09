"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsRepository } from "@/lib/api/repositories";
import { toast } from "sonner";

interface ManagementNote {
  id: string;
  product_id: string;
  author_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateManagementNoteData {
  product_id: string;
  author_id: string;
  content: string;
}

export function useManagementNotes(productId: string) {
  return useQuery({
    queryKey: ["management-notes", productId],
    queryFn: async () => {
      const data = await productsRepository.getManagementNotes(productId);
      return data as ManagementNote[];
    },
    enabled: !!productId,
  });
}

export function useManagementNoteMutations(productId: string) {
  const queryClient = useQueryClient();
  const key = ["management-notes", productId];

  const createNote = useMutation({
    mutationFn: (data: CreateManagementNoteData) =>
      productsRepository.createManagementNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast.success("Note added");
    },
    onError: (error: Error) => {
      toast.error("Failed to add note: " + error.message);
    },
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) =>
      productsRepository.deleteManagementNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast.success("Note deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete note: " + error.message);
    },
  });

  const togglePin = useMutation({
    mutationFn: (noteId: string) =>
      productsRepository.toggleManagementNotePin(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error: Error) => {
      toast.error("Failed to toggle pin: " + error.message);
    },
  });

  return { createNote, deleteNote, togglePin };
}
