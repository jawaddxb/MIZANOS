"use client";

import { redirect } from "next/navigation";
import { IntakeForm } from "@/components/organisms/intake/IntakeForm";
import { useRoleVisibility } from "@/hooks/utils/useRoleVisibility";

export default function IntakePage() {
  const { isSuperAdmin, isProjectManager, isLoading } = useRoleVisibility();

  if (!isLoading && !isSuperAdmin && !isProjectManager) {
    redirect("/projects");
  }

  if (isLoading) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <IntakeForm />
    </div>
  );
}
