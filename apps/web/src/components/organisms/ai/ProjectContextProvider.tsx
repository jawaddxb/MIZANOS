"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useParams } from "next/navigation";

import { useProductDetail } from "@/hooks/queries/useProductDetail";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectContextValue {
  productId: string | null;
  productName: string | null;
}

interface ProjectContextProviderProps {
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ProjectContext = createContext<ProjectContextValue>({
  productId: null,
  productName: null,
});

export function useProjectContext(): ProjectContextValue {
  return useContext(ProjectContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ProjectContextProvider({
  children,
}: ProjectContextProviderProps) {
  const params = useParams<{ id: string }>();
  const productId = params?.id ?? null;

  const { data } = useProductDetail(productId ?? "");

  return (
    <ProjectContext.Provider
      value={{
        productId,
        productName: data?.product?.name ?? null,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
