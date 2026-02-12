"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/layout/Dialog";
import { Button } from "@/components/molecules/buttons/Button";
import { useSocialHandleMutations } from "@/hooks/mutations/useMarketingMutations";
import type { MarketingSocialHandle } from "@/lib/types/marketing";

interface AddSocialHandleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  editHandle: MarketingSocialHandle | null;
}

const PLATFORMS = [
  "twitter", "instagram", "facebook", "linkedin", "tiktok", "youtube", "github", "other",
];

export function AddSocialHandleDialog({
  open,
  onOpenChange,
  productId,
  editHandle,
}: AddSocialHandleDialogProps) {
  const { createHandle, updateHandle } = useSocialHandleMutations(productId);
  const [platform, setPlatform] = useState("twitter");
  const [handle, setHandle] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    if (editHandle) {
      setPlatform(editHandle.platform);
      setHandle(editHandle.handle);
      setProfileUrl(editHandle.profile_url ?? "");
    } else {
      setPlatform("twitter");
      setHandle("");
      setProfileUrl("");
    }
  }, [editHandle, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      platform,
      handle,
      profile_url: profileUrl || null,
    };

    if (editHandle) {
      updateHandle.mutate(
        { id: editHandle.id, ...data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createHandle.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editHandle ? "Edit Social Handle" : "Add Social Handle"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Platform *</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Handle *</label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@username"
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Profile URL</label>
            <input
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://twitter.com/username"
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!handle.trim() || createHandle.isPending || updateHandle.isPending}
            >
              {editHandle ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
