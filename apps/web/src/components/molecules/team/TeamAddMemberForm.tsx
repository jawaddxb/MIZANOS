"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { SearchableSelect } from "@/components/molecules/forms/SearchableSelect";
import { Button } from "@/components/molecules/buttons/Button";
import type { Profile } from "@/lib/types";

interface TeamAddMemberFormProps {
  role: string;
  profiles: Profile[];
  excludeProfileIds: Set<string>;
  onAdd: (profileId: string) => void;
  isPending: boolean;
}

export function TeamAddMemberForm({
  role,
  profiles,
  excludeProfileIds,
  onAdd,
  isPending,
}: TeamAddMemberFormProps) {
  const [selectedProfile, setSelectedProfile] = useState("");

  const profileOptions = profiles
    .filter((p) => !excludeProfileIds.has(p.id))
    .map((p) => ({
      value: p.id,
      label: p.full_name || p.email || "Unknown",
    }));

  const handleAdd = () => {
    if (!selectedProfile) return;
    onAdd(selectedProfile);
    setSelectedProfile("");
  };

  return (
    <div className="flex items-end gap-2 mt-2">
      <div className="flex-1">
        <SearchableSelect
          options={profileOptions}
          value={selectedProfile}
          onValueChange={setSelectedProfile}
          placeholder="Select a person..."
          emptyLabel="No available members"
        />
      </div>
      <Button
        size="sm"
        onClick={handleAdd}
        disabled={!selectedProfile || isPending}
      >
        <UserPlus className="h-4 w-4 mr-1" />
        Add
      </Button>
    </div>
  );
}
