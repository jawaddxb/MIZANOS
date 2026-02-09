"use client";

import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { Button } from "@/components/molecules/buttons/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/layout/DropdownMenu";
import { teamRepository } from "@/lib/api/repositories";
import type { Profile } from "@/lib/types";
import type { AppRole } from "@/lib/types/enums";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  UserPlus,
  Search,
  MoreVertical,
  Shield,
  KeyRound,
  UserX,
  UserCheck,
  Loader2,
} from "lucide-react";

interface UserManagementTabProps {
  className?: string;
  onInviteUser?: () => void;
  onViewPermissions?: (profile: Profile) => void;
  onResetPassword?: (profile: Profile) => void;
}

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  pm: "secondary",
  engineer: "secondary",
  bizdev: "outline",
  marketing: "outline",
};

function useUsers() {
  return useQuery({
    queryKey: ["team", "profiles"],
    queryFn: async () => {
      const result = await teamRepository.getProfiles({ pageSize: 200 });
      return result.data;
    },
  });
}

function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, status }: { profileId: string; status: string }) =>
      teamRepository.updateProfile(profileId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "profiles"] });
    },
  });
}

function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case "active":
      return <Badge variant="default">Active</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "suspended":
      return <Badge variant="destructive">Suspended</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function RoleBadge({ role }: { role: AppRole | null }) {
  return (
    <Badge variant={ROLE_VARIANTS[role ?? ""] ?? "outline"}>
      {role?.toUpperCase() ?? "None"}
    </Badge>
  );
}

export function UserManagementTab({
  className,
  onInviteUser,
  onViewPermissions,
  onResetPassword,
}: UserManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: users, isLoading } = useUsers();
  const updateStatus = useUpdateUserStatus();

  const filteredUsers = useMemo(
    () =>
      users?.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ?? [],
    [users, searchQuery],
  );

  const handleToggleSuspend = useCallback(
    (profile: Profile) => {
      const newStatus = profile.status === "suspended" ? "active" : "suspended";
      updateStatus.mutate({ profileId: profile.id, status: newStatus });
    },
    [updateStatus],
  );

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">User Management</h3>
            <p className="text-sm text-muted-foreground">
              Invite users, manage permissions, and control access
            </p>
          </div>
          {onInviteUser && (
            <Button onClick={onInviteUser}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          )}
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <BaseInput
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Invited</th>
                  <th className="text-left py-3 px-4 font-medium">Last Login</th>
                  <th className="w-[50px] py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">
                        {user.full_name ?? "\u2014"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.email ?? "\u2014"}
                      </td>
                      <td className="py-3 px-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {user.invited_at
                          ? format(new Date(user.invited_at), "MMM d, yyyy")
                          : "\u2014"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {user.last_login
                          ? format(new Date(user.last_login), "MMM d, yyyy")
                          : "Never"}
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onViewPermissions && (
                              <DropdownMenuItem
                                onClick={() => onViewPermissions(user)}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                View Permissions
                              </DropdownMenuItem>
                            )}
                            {onResetPassword && (
                              <DropdownMenuItem
                                onClick={() => onResetPassword(user)}
                              >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleSuspend(user)}
                              className={
                                user.status === "suspended"
                                  ? "text-green-600"
                                  : "text-destructive"
                              }
                            >
                              {user.status === "suspended" ? (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate User
                                </>
                              ) : (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend User
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
