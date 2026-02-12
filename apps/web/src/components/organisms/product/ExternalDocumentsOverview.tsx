"use client";

import { useState } from "react";
import { ExternalLink, Plus, Table2, FileText, Presentation, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Button } from "@/components/molecules/buttons/Button";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import {
  useExternalDocuments,
  useAddExternalDocument,
} from "@/hooks/queries/useExternalDocuments";
import { cn } from "@/lib/utils/cn";
import { AddExternalDocumentDialog } from "./AddExternalDocumentDialog";
import type { ExternalDocumentLink } from "@/lib/types";

interface ExternalDocumentsOverviewProps {
  productId: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  marketing: { label: "Marketing", color: "bg-pillar-marketing/10 text-pillar-marketing" },
  development: { label: "Development", color: "bg-pillar-development/10 text-pillar-development" },
  production: { label: "Production", color: "bg-pillar-product/10 text-pillar-product" },
  project_management: { label: "Project Mgmt", color: "bg-pillar-business/10 text-pillar-business" },
  general: { label: "General", color: "bg-muted text-muted-foreground" },
};

const DOC_TYPE_ICONS: Record<string, typeof Table2> = {
  google_sheet: Table2,
  google_doc: FileText,
  google_slide: Presentation,
  notion: FileText,
  figma: Globe,
  miro: Globe,
  other: Globe,
};

export function ExternalDocumentsOverview({ productId }: ExternalDocumentsOverviewProps) {
  const { data: externalDocs, isLoading } = useExternalDocuments(productId);
  const addDoc = useAddExternalDocument(productId);
  const [addOpen, setAddOpen] = useState(false);

  const grouped = (externalDocs ?? []).reduce<Record<string, ExternalDocumentLink[]>>(
    (acc, doc) => {
      const cat = doc.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(doc);
      return acc;
    },
    {},
  );

  const hasDocuments = (externalDocs?.length ?? 0) > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> Key Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" /> Key Documents
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasDocuments ? (
            <div className="space-y-4">
              {Object.entries(grouped).map(([category, docs]) => {
                const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.general;
                return (
                  <div key={category} className="space-y-2">
                    <Badge variant="outline" className={cn("text-xs", config.color)}>
                      {config.label}
                    </Badge>
                    <div className="space-y-1">
                      {docs.map((doc) => {
                        const Icon = DOC_TYPE_ICONS[doc.doc_type] ?? Globe;
                        return (
                          <a
                            key={doc.id}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors group"
                          >
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate flex-1 group-hover:text-primary">
                              {doc.name}
                            </span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                No external documents linked yet
              </p>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Document Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddExternalDocumentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={async (data) => {
          await addDoc.mutateAsync(data);
          setAddOpen(false);
        }}
        isAdding={addDoc.isPending}
      />
    </>
  );
}
