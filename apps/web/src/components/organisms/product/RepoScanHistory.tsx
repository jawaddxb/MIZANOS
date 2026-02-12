"use client";

import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { Loader2, ScanSearch, Play } from "lucide-react";
import {
  useRepoScanHistory,
  useTriggerRepoScan,
} from "@/hooks/queries/useRepoScans";
import type { RepoScanHistory as RepoScanType } from "@/lib/types";

interface RepoScanHistoryProps {
  productId: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  no_changes: "secondary",
  error: "destructive",
  pending: "outline",
};

function ScanRow({ scan }: { scan: RepoScanType }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <ScanSearch className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={STATUS_VARIANT[scan.scan_status] ?? "outline"}
            className="text-[10px]"
          >
            {scan.scan_status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {scan.branch}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(scan.created_at).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{scan.files_changed} files changed</span>
          <span className="text-status-healthy">+{scan.lines_added}</span>
          <span className="text-status-critical">-{scan.lines_removed}</span>
        </div>
        {scan.diff_summary && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {scan.diff_summary}
          </p>
        )}
        {scan.error_message && (
          <p className="text-xs text-status-critical mt-1">
            {scan.error_message}
          </p>
        )}
        <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
          {scan.latest_commit_sha.slice(0, 7)}
          {scan.previous_commit_sha
            ? ` <- ${scan.previous_commit_sha.slice(0, 7)}`
            : ""}
        </p>
      </div>
    </div>
  );
}

export function RepoScanHistory({ productId }: RepoScanHistoryProps) {
  const { data: scans = [], isLoading } = useRepoScanHistory(productId);
  const triggerScan = useTriggerRepoScan(productId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <ScanSearch className="h-4 w-4" />
          Repo Scan History ({scans.length})
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => triggerScan.mutate()}
          disabled={triggerScan.isPending}
        >
          {triggerScan.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          Scan Now
        </Button>
      </div>

      {scans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ScanSearch className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="font-medium">No scan history</p>
            <p className="text-sm text-muted-foreground mt-1">
              Trigger a scan to analyze repository changes
            </p>
          </CardContent>
        </Card>
      )}

      {scans.length > 0 && (
        <div className="space-y-2">
          {scans.map((scan) => (
            <ScanRow key={scan.id} scan={scan} />
          ))}
        </div>
      )}
    </div>
  );
}
