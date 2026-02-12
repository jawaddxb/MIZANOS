"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import {
  Globe,
  FileText,
  Mic,
  GitBranch,
  ExternalLink,
  Plus,
  RefreshCw,
  Loader2,
  Code,
  ClipboardPaste,
} from "lucide-react";
import { useProductDetail } from "@/hooks/queries/useProductDetail";
import { useSpecificationSources } from "@/hooks/queries/useSpecificationSources";
import { useRegenerateSpecification } from "@/hooks/mutations/useSpecificationMutations";
import { formatDistanceToNow } from "date-fns";
import { AddSourceDialog } from "./AddSourceDialog";

export interface SourcesTabProps {
  productId: string;
}

interface SpecSource {
  id: string;
  source_type: string;
  file_name?: string | null;
  url?: string | null;
  raw_content?: string | null;
  transcription?: string | null;
  ai_summary?: string | null;
  created_at: string;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  document: <FileText className="h-4 w-4" />,
  audio: <Mic className="h-4 w-4" />,
  markdown: <Code className="h-4 w-4" />,
  paste: <ClipboardPaste className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  github: <GitBranch className="h-4 w-4" />,
};

export function SourcesTab({ productId }: SourcesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading: productLoading } = useProductDetail(productId);
  const { data: specSources, isLoading: sourcesLoading } = useSpecificationSources(productId);
  const regenerate = useRegenerateSpecification(productId);
  const product = data?.product;

  const sources: SpecSource[] = (specSources ?? []).map((s) => ({
    id: s.id,
    source_type: s.source_type,
    file_name: s.file_name,
    url: s.url,
    raw_content: s.raw_content,
    transcription: s.transcription,
    ai_summary: typeof s.ai_summary === "string" ? s.ai_summary : s.ai_summary ? JSON.stringify(s.ai_summary) : null,
    created_at: s.created_at,
  }));

  const isLoading = productLoading || sourcesLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Project Sources</h2>
          <p className="text-sm text-muted-foreground">
            Documents, websites, audio notes, and repositories used during intake
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Regenerate Spec
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Source
          </Button>
        </div>
      </div>

      {product?.repository_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              GitHub Repository
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <a
                href={product.repository_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {product.repository_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {sources.length > 0 ? (
        <div className="space-y-3">
          {sources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="font-medium">No intake sources recorded</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sources are captured during the intake process
            </p>
          </CardContent>
        </Card>
      )}

      <AddSourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
      />
    </div>
  );
}

function SourceCard({ source }: { source: SpecSource }) {
  const icon = SOURCE_ICONS[source.source_type] || <FileText className="h-4 w-4" />;

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="p-2 rounded-lg bg-secondary flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {source.file_name || source.url || `${source.source_type} source`}
            </p>
            <Badge variant="outline" className="text-xs">{source.source_type}</Badge>
          </div>
          {source.ai_summary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.ai_summary}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Added {formatDistanceToNow(new Date(source.created_at), { addSuffix: true })}
          </p>
        </div>
        {source.url && (
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
