"use client";

import { useState } from "react";
import { BarChart3, FileDown, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/molecules/layout/PageHeader";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { ReportsOverview } from "@/components/organisms/reports/ReportsOverview";
import { ProjectReportsList } from "@/components/organisms/reports/ProjectReportsList";
import { GenerateReportDialog } from "@/components/organisms/reports/GenerateReportDialog";
import { useReportsSummary } from "@/hooks/queries/useReports";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ReportsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, isFetching } = useReportsSummary();
  const queryClient = useQueryClient();

  const handleScan = () => {
    queryClient.fetchQuery({
      queryKey: ["reports-summary", "refresh"],
      queryFn: async () => {
        const { reportsRepository } = await import("@/lib/api/repositories");
        return reportsRepository.getSummary(true);
      },
    }).then((freshData) => {
      queryClient.setQueryData(["reports-summary"], freshData);
      toast.success("Scan complete — commit data refreshed");
    }).catch(() => {
      toast.error("Scan failed");
    });
    toast.info("Scanning repositories for latest commit data...");
  };

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        title="Reports"
        subtitle="Project status, task progress, and development metrics"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
      >
        <div className="flex items-center gap-2">
          <BaseButton
            onClick={handleScan}
            size="sm"
            variant="outline"
            disabled={isLoading || isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Scanning..." : "Scan"}
          </BaseButton>
          <BaseButton onClick={() => setDialogOpen(true)} size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Generate Report
          </BaseButton>
        </div>
      </PageHeader>
      <ReportsOverview />
      <ProjectReportsList />

      {data?.projects && (
        <GenerateReportDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          projects={data.projects}
        />
      )}
    </div>
  );
}
