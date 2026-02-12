"use client";

import { useState, useMemo } from "react";
import { Shield, Plus, Lock } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { VaultSearch } from "./VaultSearch";
import { VaultCategorySection } from "./VaultCategorySection";
import { AddCredentialDialog } from "./AddCredentialDialog";
import { EditCredentialDialog } from "./EditCredentialDialog";
import { useVaultCredentials } from "@/hooks/queries/useVaultCredentials";
import type { CompanyCredential, CredentialCategory } from "@/lib/types/vault";

const CATEGORY_ORDER: CredentialCategory[] = [
  "api_key",
  "service_login",
  "database",
  "cloud_provider",
  "domain_registrar",
  "email_service",
  "payment_gateway",
  "monitoring",
  "other",
];

export function VaultList() {
  const { data: credentials = [], isLoading } = useVaultCredentials();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CredentialCategory | "all">("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editCredential, setEditCredential] = useState<CompanyCredential | null>(null);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    credentials.forEach((c) => c.tags?.forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [credentials]);

  const filtered = useMemo(() => {
    return credentials.filter((c) => {
      const matchesSearch =
        !search ||
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.service_name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
      const matchesTag = tagFilter === "all" || c.tags?.includes(tagFilter);
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [credentials, search, categoryFilter, tagFilter]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, CompanyCredential[]> = {};
    filtered.forEach((c) => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    return CATEGORY_ORDER.filter((cat) => groups[cat]?.length > 0).map((cat) => ({
      category: cat,
      credentials: groups[cat],
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Credential Vault
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Encrypted repository for company-wide credentials and API keys
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Credential
        </Button>
      </div>

      {/* Search & Filter */}
      <VaultSearch
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        availableTags={availableTags}
      />

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading vault...</div>
      ) : groupedByCategory.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-muted-foreground">
            {credentials.length === 0 ? "No credentials stored yet" : "No credentials match your filters"}
          </h3>
          {credentials.length === 0 && (
            <Button variant="outline" className="mt-2" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByCategory.map(({ category, credentials: catCreds }) => (
            <VaultCategorySection key={category} category={category} credentials={catCreds} onEditCredential={setEditCredential} />
          ))}
        </div>
      )}

      <AddCredentialDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <EditCredentialDialog
        open={editCredential !== null}
        onOpenChange={(open) => { if (!open) setEditCredential(null); }}
        credential={editCredential}
      />
    </div>
  );
}
