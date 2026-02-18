"use client";

import { Trash2 } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/atoms/display/Avatar";

interface TeamMemberCardProps {
  name: string;
  email: string | null;
  avatarUrl: string | null;
  canRemove: boolean;
  onRemove: () => void;
  isRemoving: boolean;
}

export function TeamMemberCard({
  name,
  email,
  avatarUrl,
  canRemove,
  onRemove,
  isRemoving,
}: TeamMemberCardProps) {
  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-card border">
      <Avatar className="h-8 w-8">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
