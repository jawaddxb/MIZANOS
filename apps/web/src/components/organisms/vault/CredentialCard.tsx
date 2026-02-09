"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Pencil, Trash2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { Badge } from "@/components/atoms/display/Badge";
import { vaultRepository } from "@/lib/api/repositories";
import type { CompanyCredential } from "@/lib/types/vault";

interface CredentialCardProps {
  credential: CompanyCredential;
  onEdit?: (credential: CompanyCredential) => void;
}

interface RevealedFields {
  username?: string;
  email?: string;
  password?: string;
  apiSecret?: string;
  notes?: string;
}

export function CredentialCard({ credential, onEdit }: CredentialCardProps) {
  const [revealed, setRevealed] = useState<RevealedFields>({});
  const [isRevealing, setIsRevealing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasEncryptedFields =
    credential.username_encrypted ||
    credential.email_encrypted ||
    credential.password_encrypted ||
    credential.api_secret_encrypted;

  const handleRevealAll = async () => {
    if (Object.keys(revealed).length > 0) {
      setRevealed({});
      return;
    }
    setIsRevealing(true);
    try {
      const decrypted = await vaultRepository.decrypt(credential.id);
      setRevealed(decrypted);
    } catch {
      // silently fail
    } finally {
      setIsRevealing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const formattedDate = new Date(credential.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border bg-card p-4 group hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">{credential.label}</h4>
            {credential.service_name && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {credential.service_name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {credential.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {credential.url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(credential.url!, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {hasEncryptedFields && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRevealAll} disabled={isRevealing}>
              {Object.keys(revealed).length > 0 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(credential)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded detail area */}
      {(isExpanded || Object.keys(revealed).length > 0) && hasEncryptedFields && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-0">
          <CredentialField label="Username" value={revealed.username} onCopy={copyToClipboard} />
          <CredentialField label="Email" value={revealed.email} onCopy={copyToClipboard} />
          <CredentialField label="Password / Key" value={revealed.password} onCopy={copyToClipboard} />
          <CredentialField label="API Secret" value={revealed.apiSecret} onCopy={copyToClipboard} />
          {revealed.notes && (
            <div className="pt-2">
              <span className="text-sm text-muted-foreground">Notes</span>
              <p className="text-sm mt-1 text-foreground whitespace-pre-wrap">{revealed.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CredentialFieldProps {
  label: string;
  value: string | undefined;
  onCopy: (text: string) => void;
}

function CredentialField({ label, value, onCopy }: CredentialFieldProps) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <code className="text-sm font-mono truncate flex-1 text-foreground">{value}</code>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onCopy(value)}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
