"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { useResetUserPassword } from "@/hooks/queries/useUserManagement";
import type { Profile } from "@/lib/types";
import { Loader2, AlertTriangle } from "lucide-react";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  profile,
}: ResetPasswordDialogProps) {
  const resetPassword = useResetUserPassword();

  const handleConfirm = useCallback(() => {
    if (!profile?.user_id) return;
    resetPassword.mutate(profile.user_id, {
      onSuccess: () => onOpenChange(false),
    });
  }, [profile?.user_id, resetPassword, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to reset the password for{" "}
            <strong>{profile?.full_name ?? "this user"}</strong>? A new temporary
            password will be generated.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
