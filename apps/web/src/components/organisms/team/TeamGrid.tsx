"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Users, UserCheck, UserX, Briefcase, Crown, Megaphone } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { PageHeader } from "@/components/molecules/layout/PageHeader";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { TeamMemberCard } from "./TeamMemberCard";
import { TeamCapacityOverview } from "./TeamCapacityOverview";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";
import { SkillFilter } from "@/components/molecules/filters/SkillFilter";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { useEvaluationSummaries } from "@/hooks/queries/useEvaluations";
import type { Profile } from "@/lib/types/user";
import type { EvaluationSummary } from "@/lib/types/evaluation";

const ROLE_TABS = [
  { id: "all", label: "All Team", icon: Users },
  { id: "engineer", label: "AI Engineers", icon: Users },
  { id: "pm", label: "Project Managers", icon: UserCheck },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "bizdev", label: "Biz Dev", icon: Briefcase },
  { id: "admin", label: "Senior Mgmt", icon: Crown },
] as const;

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "score", label: "Score (High→Low)" },
] as const;

export function TeamGrid() {
  const { data: profiles = [], isLoading } = useProfiles();
  const { data: summaries = [] } = useEvaluationSummaries();
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("name");

  const summaryMap = useMemo(() => {
    const map = new Map<string, EvaluationSummary>();
    summaries.forEach((s) => map.set(s.profile_id, s));
    return map;
  }, [summaries]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: profiles.length };
    profiles.forEach((p) => {
      counts[p.role ?? "unknown"] = (counts[p.role ?? "unknown"] ?? 0) + 1;
    });
    return counts;
  }, [profiles]);

  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    profiles.forEach((p) => p.skills?.forEach((s) => skillSet.add(s)));
    return Array.from(skillSet).sort();
  }, [profiles]);

  const filteredTeam = useMemo(() => {
    const filtered = profiles.filter((member) => {
      const matchesRole = activeTab === "all" || member.role === activeTab;
      const matchesSearch =
        !searchQuery ||
        member.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAvailability =
        availabilityFilter === "all" || member.availability === availabilityFilter;
      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every((s) => member.skills?.includes(s));
      return matchesRole && matchesSearch && matchesAvailability && matchesSkills;
    });

    if (sortBy === "score") {
      filtered.sort((a, b) => {
        const scoreA = summaryMap.get(a.id)?.overall_score ?? 0;
        const scoreB = summaryMap.get(b.id)?.overall_score ?? 0;
        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [profiles, activeTab, searchQuery, availabilityFilter, selectedSkills, sortBy, summaryMap]);

  const availableCount = filteredTeam.filter((m) => m.availability === "available").length;
  const busyCount = filteredTeam.filter((m) => m.availability === "busy").length;
  const unavailableCount = filteredTeam.filter((m) => m.availability === "unavailable").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        subtitle="Manage your team members"
        icon={<Users className="h-5 w-5 text-primary" />}
      >
        <Button onClick={() => setAddMemberOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </PageHeader>

      {!isLoading && profiles.length > 0 && (
        <TeamCapacityOverview profiles={profiles} />
      )}

      <div className="flex gap-1 border-b overflow-x-auto">
        {ROLE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className="ml-1 text-xs bg-secondary px-1.5 py-0.5 rounded">
                {roleCounts[tab.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-6 p-4 bg-card rounded-lg border">
        <StatDot color="bg-status-healthy" label="Available" count={availableCount} />
        <StatDot color="bg-status-warning" label="Busy" count={busyCount} />
        <StatDot color="bg-status-critical" label="Unavailable" count={unavailableCount} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-md border bg-background pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm w-40"
        >
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm w-40"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <SkillFilter
          selectedSkills={selectedSkills}
          onSkillsChange={setSelectedSkills}
          availableSkills={allSkills}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="text-center py-12">
          <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No team members found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeam.map((member) => (
            <TeamMemberCard
              key={member.id}
              profile={member}
              evaluationSummary={summaryMap.get(member.id)}
            />
          ))}
        </div>
      )}

      <AddTeamMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} />
    </div>
  );
}

function StatDot({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium">{count}</span>
    </div>
  );
}
