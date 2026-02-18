"use client";

import { Suspense } from "react";
import { KnowledgeList } from "@/components/organisms/knowledge/KnowledgeList";

export default function KnowledgePage() {
  return (
    <div className="p-6">
      <Suspense>
        <KnowledgeList />
      </Suspense>
    </div>
  );
}
