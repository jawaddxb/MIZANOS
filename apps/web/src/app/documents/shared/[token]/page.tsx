"use client";

import { use } from "react";
import { SharedDocumentViewer } from "@/components/organisms/documents/SharedDocumentViewer";

interface SharedDocumentsPageProps {
  params: Promise<{ token: string }>;
}

export default function SharedDocumentsPage({ params }: SharedDocumentsPageProps) {
  const { token } = use(params);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <SharedDocumentViewer token={token} />
    </div>
  );
}
