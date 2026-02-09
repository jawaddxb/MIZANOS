"use client";

import { use, useState } from "react";
import { Loader2, Pencil, Eye } from "lucide-react";

import { ProductTabs } from "@/components/organisms/product/ProductTabs";
import { ProductOverview } from "@/components/organisms/product/ProductOverview";
import { SpecViewer } from "@/components/organisms/product/SpecViewer";
import { SpecEditor } from "@/components/organisms/product/SpecEditor";
import { TasksTab } from "@/components/organisms/product/TasksTab";
import { DocumentsList } from "@/components/organisms/product/DocumentsList";
import { DocumentUpload } from "@/components/organisms/product/DocumentUpload";
import { AuditHistoryList } from "@/components/organisms/product/AuditHistoryList";
import { DeploymentChecklist } from "@/components/organisms/product/DeploymentChecklist";
import { GoLiveChecklist } from "@/components/organisms/product/GoLiveChecklist";
import { ProjectIntegrations } from "@/components/organisms/product/ProjectIntegrations";
import { CommitHistory } from "@/components/organisms/product/CommitHistory";
import { QATab } from "@/components/organisms/product/QATab";
import { EnvironmentsTab } from "@/components/organisms/product/EnvironmentsTab";
import { FeaturesTab } from "@/components/organisms/product/FeaturesTab";
import { MarketingTabWrapper } from "@/components/organisms/product/MarketingTabWrapper";
import { SourcesTab } from "@/components/organisms/product/SourcesTab";
import { FloatingAIButton } from "@/components/organisms/ai/FloatingAIButton";
import { Dialog, DialogContent } from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { useProductDetail } from "@/hooks/queries/useProductDetail";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = use(params);
  const { data: product, isLoading } = useProductDetail(id);
  const [specEditing, setSpecEditing] = useState(false);
  const [docUploadOpen, setDocUploadOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-semibold">Product not found</h2>
        <p className="text-muted-foreground mt-2">The requested product does not exist.</p>
      </div>
    );
  }

  const specContent = (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => setSpecEditing(!specEditing)}>
          {specEditing ? <><Eye className="h-4 w-4 mr-1" /> View</> : <><Pencil className="h-4 w-4 mr-1" /> Edit</>}
        </Button>
      </div>
      {specEditing
        ? <SpecEditor productId={id} />
        : <SpecViewer productId={id} productName={product.product?.name ?? "Product"} />}
    </div>
  );

  const documentsContent = (
    <>
      <DocumentsList productId={id} onUploadClick={() => setDocUploadOpen(true)} />
      <Dialog open={docUploadOpen} onOpenChange={setDocUploadOpen}>
        <DialogContent className="max-w-lg">
          <DocumentUpload productId={id} onComplete={() => setDocUploadOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ProductTabs
        productId={id}
        overviewContent={<ProductOverview productId={id} />}
        specContent={specContent}
        tasksContent={<TasksTab productId={id} />}
        documentsContent={documentsContent}
        auditContent={<AuditHistoryList productId={id} />}
        deploymentContent={
          <div className="space-y-6">
            <DeploymentChecklist productId={id} />
            <GoLiveChecklist productId={id} />
            <ProjectIntegrations productId={id} />
          </div>
        }
        commitContent={<CommitHistory productId={id} repositoryUrl={product.product?.repository_url} />}
        qaContent={<QATab productId={id} />}
        environmentsContent={<EnvironmentsTab productId={id} />}
        featuresContent={<FeaturesTab productId={id} />}
        marketingContent={<MarketingTabWrapper productId={id} />}
        sourcesContent={<SourcesTab productId={id} />}
      />
      <FloatingAIButton
        productId={id}
        productName={product.product?.name}
      />
    </div>
  );
}
