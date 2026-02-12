"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { cn } from "@/lib/utils/cn";
import {
  Globe,
  Server,
  Monitor,
  ExternalLink,
  GitBranch,
  Calendar,
} from "lucide-react";
import { useProductDetail } from "@/hooks/queries/useProductDetail";
import { useProductEnvironments } from "@/hooks/queries/useProductEnvironments";
import type { ProductEnvironment } from "@/lib/types";
import { ConfigureEnvironmentDialog } from "./ConfigureEnvironmentDialog";

export interface EnvironmentsTabProps {
  productId: string;
}

interface EnvironmentInfo {
  type: "development" | "staging" | "production";
  label: string;
  icon: React.ReactNode;
  color: string;
}

const ENV_CONFIG: EnvironmentInfo[] = [
  { type: "development", label: "Development", icon: <Monitor className="h-5 w-5" />, color: "text-pillar-development" },
  { type: "staging", label: "Staging", icon: <Server className="h-5 w-5" />, color: "text-status-warning" },
  { type: "production", label: "Production", icon: <Globe className="h-5 w-5" />, color: "text-status-healthy" },
];

export function EnvironmentsTab({ productId }: EnvironmentsTabProps) {
  const { data, isLoading } = useProductDetail(productId);
  const { data: environments = [] } = useProductEnvironments(productId);
  const product = data?.product;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ENV_CONFIG.map((env) => {
        const envData = environments.find((e: ProductEnvironment) => e.environment_type === env.type);
        return (
          <EnvironmentCard
            key={env.type}
            config={env}
            repositoryUrl={product?.repository_url}
            environment={envData}
            productId={productId}
          />
        );
      })}
    </div>
  );
}

function EnvironmentCard({ config, repositoryUrl, environment, productId }: {
  config: EnvironmentInfo;
  repositoryUrl?: string | null;
  environment?: ProductEnvironment;
  productId: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isConfigured = !!environment;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base">
            <div className={cn("p-2 rounded-lg bg-secondary", config.color)}>
              {config.icon}
            </div>
            {config.label}
            <Badge variant={isConfigured ? "default" : "outline"} className="ml-auto text-xs">
              {isConfigured ? environment.status ?? "Active" : "Not configured"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow icon={<Globe className="h-4 w-4" />} label="URL" value={environment?.url ?? "Not set"} isLink={!!environment?.url} />
            <InfoRow icon={<GitBranch className="h-4 w-4" />} label="Branch" value={environment?.branch ?? (config.type === "development" ? "main" : config.type)} />
            {repositoryUrl && config.type === "development" && (
              <InfoRow icon={<ExternalLink className="h-4 w-4" />} label="Repository" value={repositoryUrl} isLink />
            )}
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Last deployed" value={environment?.last_deployment_at ? new Date(environment.last_deployment_at).toLocaleDateString() : "Never"} />
          </div>
          <div className="mt-4 pt-4 border-t flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>Configure</Button>
          </div>
        </CardContent>
      </Card>
      <ConfigureEnvironmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        environmentType={config.type}
        existing={environment}
      />
    </>
  );
}

function InfoRow({ icon, label, value, isLink }: {
  icon: React.ReactNode; label: string; value: string; isLink?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
          {value}
        </a>
      ) : (
        <span className="text-foreground truncate">{value}</span>
      )}
    </div>
  );
}
