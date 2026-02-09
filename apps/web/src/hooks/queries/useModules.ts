"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsRepository } from "@/lib/api/repositories";
import type { Module } from "@/lib/types";

export function useModules() {
  return useQuery({
    queryKey: ["modules"],
    queryFn: (): Promise<Module[]> => settingsRepository.getModules(),
  });
}

export function useModulesByCategory() {
  const { data: modules, ...rest } = useModules();

  const categories = modules
    ? [...new Set(modules.map((m) => m.category))]
    : [];

  const modulesByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = modules?.filter((m) => m.category === category) ?? [];
      return acc;
    },
    {} as Record<string, Module[]>,
  );

  return { categories, modulesByCategory, ...rest };
}
