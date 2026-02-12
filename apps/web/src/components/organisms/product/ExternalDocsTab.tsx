"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import {
  useExternalDocuments,
  useDeleteExternalDocument,
  useAddExternalDocument,
} from "@/hooks/queries/useExternalDocuments";
import { ExternalLink, Plus, Trash2, Globe, Loader2 } from "lucide-react";
import { AddExternalDocumentDialog } from "./AddExternalDocumentDialog";
import type { ExternalDocumentLink } from "@/lib/types";

interface ExternalDocsTabProps {
  productId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  marketing: "bg-pillar-marketing/10 text-pillar-marketing",
  development: "bg-pillar-development/10 text-pillar-development",
  production: "bg-pillar-product/10 text-pillar-product",
  project_management: "bg-pillar-business/10 text-pillar-business",
  general: "bg-muted text-muted-foreground",
};

export function ExternalDocsTab({ productId }: ExternalDocsTabProps) {
  const { data: docs, isLoading } = useExternalDocuments(productId);
  const addDoc = useAddExternalDocument(productId);
  const deleteDoc = useDeleteExternalDocument(productId);
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">External Documents</h3>
          <p className="text-xs text-muted-foreground">
            Link to Google Docs, Notion, Figma, and other external documents
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Link
        </Button>
      </div>

      {(docs ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Globe className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No external documents linked yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {docs?.map((doc) => (
            <ExternalDocRow
              key={doc.id}
              doc={doc}
              onDelete={() => deleteDoc.mutate(doc.id)}
            />
          ))}
        </div>
      )}

      <AddExternalDocumentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={async (data) => {
          await addDoc.mutateAsync(data);
          setAddOpen(false);
        }}
        isAdding={addDoc.isPending}
      />
    </div>
  );
}

function ExternalDocRow({
  doc,
  onDelete,
}: {
  doc: ExternalDocumentLink;
  onDelete: () => void;
}) {
  const categoryColor =
    CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS.general;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:text-primary flex items-center gap-1"
          >
            {doc.name}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
          </a>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={`text-[10px] ${categoryColor}`}>
              {doc.category.replace("_", " ")}
            </Badge>
            <span className="text-[10px] text-muted-foreground capitalize">
              {doc.doc_type.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-1.5 rounded hover:bg-destructive/10 shrink-0"
        title="Remove link"
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </button>
    </div>
  );
}
