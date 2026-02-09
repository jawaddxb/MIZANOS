"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { authRepository, teamRepository } from "@/lib/api/repositories";
import type { Profile } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ProfileTabProps {
  className?: string;
}

function useCurrentProfile() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authRepository.me(),
  });
}

function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["team", "profiles", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");
      const result = await teamRepository.getProfiles({ search: userId });
      const match = result.data.find((p) => p.user_id === userId);
      if (!match) throw new Error("Profile not found");
      return match;
    },
    enabled: !!userId,
  });
}

function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      data,
    }: {
      profileId: string;
      data: Partial<Profile>;
    }) => teamRepository.updateProfile(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "profiles"] });
    },
  });
}

export function ProfileTab({ className }: ProfileTabProps) {
  const { data: currentUser } = useCurrentProfile();
  const { data: profile, isLoading } = useProfile(currentUser?.id);
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [hasEdited, setHasEdited] = useState(false);

  const displayName = hasEdited
    ? fullName
    : profile?.full_name ?? currentUser?.email ?? "";

  const handleSave = useCallback(async () => {
    if (!profile) return;

    try {
      await updateProfile.mutateAsync({
        profileId: profile.id,
        data: { full_name: fullName || displayName },
      });
      toast.success("Profile updated successfully");
      setHasEdited(false);
    } catch {
      toast.error("Failed to update profile");
    }
  }, [profile, fullName, displayName, updateProfile]);

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="p-6">
          <h3 className="text-lg font-semibold">Profile Settings</h3>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  const roleDisplay = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "Engineer";

  return (
    <Card className={className}>
      <div className="p-6">
        <h3 className="text-lg font-semibold">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account details
        </p>
      </div>
      <div className="px-6 pb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <BaseLabel htmlFor="profile-name">Full Name</BaseLabel>
            <BaseInput
              id="profile-name"
              value={displayName}
              onChange={(e) => {
                setFullName(e.target.value);
                setHasEdited(true);
              }}
            />
          </div>
          <div className="space-y-2">
            <BaseLabel htmlFor="profile-email">Email</BaseLabel>
            <BaseInput
              id="profile-email"
              type="email"
              value={currentUser?.email ?? ""}
              disabled
            />
          </div>
        </div>
        <div className="space-y-2">
          <BaseLabel htmlFor="profile-role">Role</BaseLabel>
          <BaseInput id="profile-role" value={roleDisplay} disabled />
        </div>
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending || !hasEdited}
          >
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
