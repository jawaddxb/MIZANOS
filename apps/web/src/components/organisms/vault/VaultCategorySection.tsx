"use client";

import { CredentialCard } from "./CredentialCard";
import type { CompanyCredential, CredentialCategory } from "@/lib/types/vault";

const categoryLabels: Record<CredentialCategory, string> = {
  api_key: "API Keys",
  service_login: "Service Logins",
  database: "Databases",
  cloud_provider: "Cloud Providers",
  domain_registrar: "Domain Registrars",
  email_service: "Email Services",
  payment_gateway: "Payment Gateways",
  monitoring: "Monitoring",
  other: "Other",
};

interface VaultCategorySectionProps {
  category: CredentialCategory;
  credentials: CompanyCredential[];
}

export function VaultCategorySection({ category, credentials }: VaultCategorySectionProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {categoryLabels[category] ?? category} ({credentials.length})
      </h2>
      <div className="space-y-3">
        {credentials.map((credential) => (
          <CredentialCard key={credential.id} credential={credential} />
        ))}
      </div>
    </div>
  );
}
