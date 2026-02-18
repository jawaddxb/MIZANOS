"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Command } from "cmdk";
import { cn } from "@/lib/utils/cn";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/layout/Popover";
import type { Profile } from "@/lib/types";

const SUGGESTED_ORG_ROLES: Record<string, string[]> = {
  pm: ["pm", "product_manager"],
  ai_engineer: ["engineer"],
  business_owner: ["business_owner"],
  marketing: ["marketing", "bizdev"],
};

interface TeamMemberSelectProps {
  profiles: Profile[];
  productRole: string;
  excludeProfileIds: Set<string>;
  showPendingProfiles: boolean;
  placeholder?: string;
  onSelect: (profileId: string) => void;
}

function getDisplayName(profile: Profile): string {
  const name = profile.full_name || profile.email || "Unknown";
  return profile.status === "pending" ? `${name} (Pending)` : name;
}

function formatOrgRole(role: string | null): string {
  if (!role) return "";
  return role.replace(/_/g, " ");
}

export function TeamMemberSelect({
  profiles,
  productRole,
  excludeProfileIds,
  showPendingProfiles,
  placeholder = "Select...",
  onSelect,
}: TeamMemberSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { suggested, others } = useMemo(() => {
    const available = profiles
      .filter((p) => !excludeProfileIds.has(p.id))
      .filter((p) => showPendingProfiles || p.status !== "pending");

    const suggestedRoles = SUGGESTED_ORG_ROLES[productRole] ?? [];
    const suggestedList: Profile[] = [];
    const othersList: Profile[] = [];

    for (const p of available) {
      if (p.role && suggestedRoles.includes(p.role)) {
        suggestedList.push(p);
      } else {
        othersList.push(p);
      }
    }

    return { suggested: suggestedList, others: othersList };
  }, [profiles, excludeProfileIds, showPendingProfiles, productRole]);

  const filterBySearch = (list: Profile[]): Profile[] => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q),
    );
  };

  const filteredSuggested = filterBySearch(suggested);
  const filteredOthers = filterBySearch(others);
  const hasResults = filteredSuggested.length > 0 || filteredOthers.length > 0;

  const handleSelect = (profileId: string) => {
    onSelect(profileId);
    setOpen(false);
    setSearch("");
  };

  const renderItem = (profile: Profile) => (
    <Command.Item
      key={profile.id}
      value={profile.id}
      onSelect={() => handleSelect(profile.id)}
      className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent data-[selected=true]:bg-accent"
    >
      <span className="truncate">{getDisplayName(profile)}</span>
      {profile.role && (
        <span className="ml-2 shrink-0 text-xs text-muted-foreground">
          {formatOrgRole(profile.role)}
        </span>
      )}
    </Command.Item>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="truncate text-muted-foreground">{placeholder}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command className="rounded-md border-0" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Command.Input
              placeholder="Search..."
              value={search}
              onValueChange={setSearch}
              className={cn(
                "flex h-9 w-full bg-transparent text-sm outline-none",
                "placeholder:text-muted-foreground",
              )}
            />
          </div>
          <Command.List className="max-h-[200px] overflow-y-auto p-1">
            {!hasResults && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No available members
              </p>
            )}
            {filteredSuggested.length > 0 && (
              <Command.Group
                heading="Suggested"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {filteredSuggested.map(renderItem)}
              </Command.Group>
            )}
            {filteredOthers.length > 0 && (
              <Command.Group
                heading="All Users"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {filteredOthers.map(renderItem)}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
