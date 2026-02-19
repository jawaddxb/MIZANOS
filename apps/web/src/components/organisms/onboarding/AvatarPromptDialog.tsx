"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUploadAvatar } from "@/hooks/mutations/useAvatarMutations";
import { AvatarUpload } from "@/components/molecules/avatar/AvatarUpload";
import { Button } from "@/components/molecules/buttons/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/atoms/layout/Dialog";

const DISMISS_KEY_PREFIX = "avatar_prompt_dismissed_";

function getDismissKey(userId: string): string {
  return `${DISMISS_KEY_PREFIX}${userId}`;
}

export function AvatarPromptDialog() {
  const { user } = useAuth();
  const uploadAvatar = useUploadAvatar();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    if (user.avatar_url) return;

    const dismissed = localStorage.getItem(getDismissKey(user.id));
    if (dismissed === "true") return;

    setOpen(true);
  }, [user?.id, user?.avatar_url]);

  const handleUpload = useCallback(
    (file: File) => {
      if (!user?.profile_id) return;
      uploadAvatar.mutate(
        { profileId: user.profile_id, file },
        { onSuccess: () => setOpen(false) },
      );
    },
    [user?.profile_id, uploadAvatar],
  );

  const handleRemindLater = useCallback(() => {
    setOpen(false);
  }, []);

  const handleDontRemind = useCallback(() => {
    if (user?.id) {
      localStorage.setItem(getDismissKey(user.id), "true");
    }
    setOpen(false);
  }, [user?.id]);

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ||
    user?.email?.[0].toUpperCase() ||
    "U";

  if (!user?.id) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Profile Photo</DialogTitle>
          <DialogDescription>
            Your team wants to see the real you, not just initials! Add a
            photo so people know who they&apos;re working with.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <AvatarUpload
            avatarUrl={user.avatar_url}
            initials={initials}
            onUpload={handleUpload}
            onRemove={() => {}}
            isUploading={uploadAvatar.isPending}
            size="lg"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleDontRemind}>
            Don&apos;t remind me
          </Button>
          <Button variant="outline" onClick={handleRemindLater}>
            Remind me later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
