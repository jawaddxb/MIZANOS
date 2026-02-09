"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { documentsRepository } from "@/lib/api/repositories";
import { Download, AlertCircle, FolderOpen, Clock, Lock, FileText } from "lucide-react";

interface SharedDocument {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  category: string;
  description: string | null;
  created_at: string;
  download_url: string | null;
}

interface SharedDocumentsData {
  product: { id: string; name: string };
  link_name: string;
  documents: SharedDocument[];
}

interface SharedDocumentViewerProps {
  token: string;
}

export function SharedDocumentViewer({ token }: SharedDocumentViewerProps) {
  const [data, setData] = useState<SharedDocumentsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Invalid access link");
      setIsLoading(false);
      return;
    }

    documentsRepository
      .getSharedDocuments(token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents"))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FolderOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{data.product.name}</h1>
          <p className="text-sm text-muted-foreground">Shared via: {data.link_name}</p>
        </div>
      </div>

      {data.documents.length > 0 ? (
        <div className="grid gap-4">
          {data.documents.map((doc) => (
            <DocumentRow key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No Documents Available</h3>
          <p className="text-sm text-muted-foreground">No documents have been uploaded yet.</p>
        </div>
      )}

      <div className="pt-4 border-t text-center">
        <p className="text-xs text-muted-foreground">
          This is a secure document sharing link. Do not share this URL with unauthorized users.
        </p>
      </div>
    </div>
  );
}

function DocumentRow({ document: doc }: { document: SharedDocument }) {
  const isImage = doc.file_type.startsWith("image/");
  const sizeKb = (doc.file_size / 1024).toFixed(1);

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="shrink-0 h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{doc.file_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs capitalize">{doc.category}</Badge>
              <span className="text-xs text-muted-foreground">{sizeKb} KB</span>
              <span className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</span>
            </div>
            {doc.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{doc.description}</p>}
          </div>
          {doc.download_url && (
            <Button variant="outline" size="sm" onClick={() => window.open(doc.download_url!, "_blank")}>
              <Download className="h-4 w-4 mr-2" />
              {isImage ? "View" : "Download"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  const Icon = error.includes("expired") ? Clock : error.includes("disabled") ? Lock : AlertCircle;

  return (
    <div className="text-center py-12">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
      <p className="text-muted-foreground">{error}</p>
    </div>
  );
}
