"use client";

import { Key, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { MarketingCredential } from "@/lib/types/marketing";

interface CredentialsSectionProps {
  credentials: MarketingCredential[];
  productId: string;
}

export function CredentialsSection({ credentials }: CredentialsSectionProps) {
  if (credentials.length === 0) {
    return (
      <div className="text-center py-8">
        <Key className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No marketing credentials</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {credentials.map((c) => (
        <CredentialRow key={c.id} credential={c} />
      ))}
    </div>
  );
}

function CredentialRow({ credential }: { credential: MarketingCredential }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{credential.label}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span className="capitalize">{credential.credential_type}</span>
          {credential.username && (
            <>
              <span>&middot;</span>
              <span className="font-mono">{credential.username}</span>
            </>
          )}
        </div>
      </div>
      {credential.password_encrypted && (
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="p-1.5 rounded hover:bg-accent"
          title={showPassword ? "Hide" : "Show"}
        >
          {showPassword ? (
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
}
