"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { Badge } from "@/components/atoms/display/Badge";
import { useProducts } from "@/hooks/queries/useProducts";
import { useUpdateCredential } from "@/hooks/mutations/useVaultCredentialsMutations";
import type { CompanyCredential, CredentialCategory } from "@/lib/types/vault";

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

interface EditCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential: CompanyCredential | null;
}

export function EditCredentialDialog({
  open,
  onOpenChange,
  credential,
}: EditCredentialDialogProps) {
  const { data: products = [] } = useProducts();
  const updateCredential = useUpdateCredential();

  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<CredentialCategory>("api_key");
  const [serviceName, setServiceName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [linkedProductId, setLinkedProductId] = useState("");

  useEffect(() => {
    if (credential) {
      setLabel(credential.label);
      setCategory(credential.category as CredentialCategory);
      setServiceName(credential.service_name ?? "");
      setUrl(credential.url ?? "");
      setTags(credential.tags ?? []);
      setLinkedProductId(credential.linked_product_id ?? "");
      // Encrypted fields start empty; user fills in new values if they want to change
      setUsername("");
      setEmail("");
      setPassword("");
      setApiSecret("");
      setNotes("");
      setTagInput("");
    }
  }, [credential]);

  if (!open || !credential) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updateData: Record<string, unknown> = {
      label,
      category,
      service_name: serviceName || null,
      url: url || null,
      tags,
      linked_product_id: linkedProductId || null,
    };
    if (username) updateData.username_encrypted = username;
    if (email) updateData.email_encrypted = email;
    if (password) updateData.password_encrypted = password;
    if (apiSecret) updateData.api_secret_encrypted = apiSecret;
    if (notes) updateData.notes_encrypted = notes;

    updateCredential.mutate(
      { id: credential.id, data: updateData as Partial<CompanyCredential> },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Edit Credential</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Label *" value={label} onChange={setLabel} required />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CredentialCategory)}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              >
                {CREDENTIAL_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <FormField label="Service Name" value={serviceName} onChange={setServiceName} placeholder="e.g. GitHub" />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Username" value={username} onChange={setUsername} placeholder="Leave empty to keep existing" />
            <FormField label="Email" value={email} onChange={setEmail} type="email" placeholder="Leave empty to keep existing" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Password / API Key" value={password} onChange={setPassword} type="password" placeholder="Leave empty to keep existing" />
            <FormField label="API Secret" value={apiSecret} onChange={setApiSecret} type="password" placeholder="Leave empty to keep existing" />
          </div>
          <FormField label="URL" value={url} onChange={setUrl} type="url" placeholder="https://..." />

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Leave empty to keep existing notes..."
              className="w-full min-h-[60px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                className="flex-1 h-9 rounded-md border bg-background px-3 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Linked Project */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Link to Project</label>
            <select
              value={linkedProductId}
              onChange={(e) => setLinkedProductId(e.target.value)}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">No linked project</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!label || updateCredential.isPending}>
              {updateCredential.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

function FormField({ label, value, onChange, type = "text", placeholder, required }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-9 rounded-md border bg-background px-3 text-sm"
      />
    </div>
  );
}
