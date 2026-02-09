"use client";

import { Search } from "lucide-react";
import type { CredentialCategory } from "@/lib/types/vault";

const CREDENTIAL_CATEGORIES: { value: CredentialCategory; label: string }[] = [
  { value: "api_key", label: "API Key" },
  { value: "service_login", label: "Service Login" },
  { value: "database", label: "Database" },
  { value: "cloud_provider", label: "Cloud Provider" },
  { value: "domain_registrar", label: "Domain Registrar" },
  { value: "email_service", label: "Email Service" },
  { value: "payment_gateway", label: "Payment Gateway" },
  { value: "monitoring", label: "Monitoring" },
  { value: "other", label: "Other" },
];

interface VaultSearchProps {
  search: string;
  onSearchChange: (search: string) => void;
  categoryFilter: CredentialCategory | "all";
  onCategoryFilterChange: (category: CredentialCategory | "all") => void;
  tagFilter: string;
  onTagFilterChange: (tag: string) => void;
  availableTags: string[];
}

export function VaultSearch({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  tagFilter,
  onTagFilterChange,
  availableTags,
}: VaultSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search credentials..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-9 rounded-md border bg-background pl-9 pr-3 text-sm"
        />
      </div>
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value as CredentialCategory | "all")}
        className="h-9 rounded-md border bg-background px-3 text-sm w-full sm:w-[180px]"
      >
        <option value="all">All Categories</option>
        {CREDENTIAL_CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
      {availableTags.length > 0 && (
        <select
          value={tagFilter}
          onChange={(e) => onTagFilterChange(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm w-full sm:w-[160px]"
        >
          <option value="all">All Tags</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
