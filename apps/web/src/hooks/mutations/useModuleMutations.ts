"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import type { Module } from "@/lib/types";
import { toast } from "sonner";

interface CreateModuleInput {
  name: string;
  category: string;
  description?: string;
  docs_url?: string;
  scaffolding_url?: string;
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateModuleInput) =>
      settingsRepository.createModule(input as Partial<Module>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create module: " + error.message);
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateModuleInput>;
    }) => settingsRepository.updateModule(id, updates as Partial<Module>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update module: " + error.message);
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settingsRepository.deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete module: " + error.message);
    },
  });
}
