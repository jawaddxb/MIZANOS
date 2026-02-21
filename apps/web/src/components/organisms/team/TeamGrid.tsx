"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Users, UserX, LayoutGrid, List } from "lucide-react";
import { SortHeader } from "@/components/atoms/display/SortHeader";
import { Button } from "@/components/molecules/buttons/Button";
import { PageHeader } from "@/components/molecules/layout/PageHeader";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { TeamMemberCard } from "./TeamMemberCard";
import { TeamMemberRow } from "./TeamMemberRow";
import { TeamCapacityOverview } from "./TeamCapacityOverview";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";
import { SkillFilter } from "@/components/molecules/filters/SkillFilter";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { useEvaluationSummaries } from "@/hooks/queries/useEvaluations";
import { useAllUserRoles } from "@/hooks/queries/useUserRoles";
import type { UserRole } from "@/lib/types";
import type { EvaluationSummary } from "@/lib/types/evaluation";

const ROLE_CHIPS = [
  { value: "all", label: "All" },
  { value: "admin", label: "Leadership" },
  { value: "project_manager", label: "Project Managers" },
  { value: "business_development", label: "Business Development" },
  { value: "engineer", label: "Engineers" },
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing" },
] as const;

type SortColumn = "name" | "role" | "reports_to" | "availability" | "status";
type SortDir = "asc" | "desc";

export function TeamGrid() {
  const { data: profiles = [], isLoading } = useProfiles();
  const { data: summaries = [] } = useEvaluationSummaries();
  const { data: allUserRoles = [] } = useAllUserRoles();
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [reportsToFilter, setReportsToFilter] = useState("all");
  const [sortCol, setSortCol] = useState<SortColumn>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const toggleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const summaryMap = useMemo(() => {
    const map = new Map<string, EvaluationSummary>();
    summaries.forEach((s) => map.set(s.profile_id, s));
    return map;
  }, [summaries]);
  const rolesMap = useMemo(() => {
    const map = new Map<string, UserRole[]>();
    allUserRoles.forEach((r) => {
      const list = map.get(r.user_id) ?? [];
      list.push(r);
      map.set(r.user_id, list);
    });
    return map;
  }, [allUserRoles]);
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: profiles.length };
    profiles.forEach((p) => {
      const role = p.role ?? "unknown";
      counts[role] = (counts[role] ?? 0) + 1;
      if (role === "superadmin" || role === "business_owner") {
        counts["admin"] = (counts["admin"] ?? 0) + 1;
      }
    });
    return counts;
  }, [profiles]);
  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    profiles.forEach((p) => p.skills?.forEach((s) => skillSet.add(s)));
    return Array.from(skillSet).sort();
  }, [profiles]);
  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => map.set(p.id, p.full_name ?? "Unknown"));
    return map;
  }, [profiles]);

  const managers = useMemo(() => {
    const ids = new Set(profiles.map((p) => p.reports_to).filter(Boolean) as string[]);
    return Array.from(ids)
      .map((id) => ({ id, name: nameMap.get(id) ?? "Unknown" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [profiles, nameMap]);
  const filteredTeam = useMemo(() => {
    const filtered = profiles.filter((member) => {
      const matchesRole =
        roleFilter === "all" ||
        member.role === roleFilter ||
        (roleFilter === "admin" && (member.role === "superadmin" || member.role === "business_owner"));
      const matchesSearch =
        !searchQuery ||
        member.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAvailability =
        availabilityFilter === "all" || member.availability === availabilityFilter;
      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every((s) => member.skills?.includes(s));
      const matchesReportsTo =
        reportsToFilter === "all" ||
        (reportsToFilter === "none" ? !member.reports_to : member.reports_to === reportsToFilter);
      return matchesRole && matchesSearch && matchesAvailability && matchesSkills && matchesReportsTo;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "name":
          cmp = (a.full_name ?? "").localeCompare(b.full_name ?? "");
          break;
        case "role":
          cmp = (a.role ?? "").localeCompare(b.role ?? "");
          break;
        case "reports_to":
          cmp = (nameMap.get(a.reports_to ?? "") ?? "").localeCompare(nameMap.get(b.reports_to ?? "") ?? "");
          break;
        case "availability":
          cmp = (a.availability ?? "").localeCompare(b.availability ?? "");
          break;
        case "status":
          cmp = (a.status ?? "").localeCompare(b.status ?? "");
          break;
      }
      return cmp * dir;
    });

    return filtered;
  }, [profiles, roleFilter, searchQuery, availabilityFilter, selectedSkills, reportsToFilter, sortCol, sortDir, summaryMap, nameMap]);

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

      <div className="flex items-center gap-2 flex-wrap">
        {ROLE_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setRoleFilter(chip.value)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
              roleFilter === chip.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {chip.label}
            <span className={`text-xs ${roleFilter === chip.value ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
              {roleCounts[chip.value] ?? 0}
            </span>
          </button>
        ))}
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
          <option value="all">All Availability</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select
          value={reportsToFilter}
          onChange={(e) => setReportsToFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm w-44"
        >
          <option value="all">All</option>
          <option value="none">No Manager</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <SkillFilter
          selectedSkills={selectedSkills}
          onSkillsChange={setSelectedSkills}
          availableSkills={allSkills}
        />
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border ml-auto">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-all ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-all ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="text-center py-12">
          <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No team members found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-lg border bg-card">
          <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/50">
            <div className="shrink-0 w-10" />
            <div className="flex-1 min-w-0 grid grid-cols-[150px_120px_130px_120px_80px_1fr_100px_auto] items-center gap-4">
              <SortHeader label="Name" column="name" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Primary Role" column="role" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Additional Roles</span>
              <SortHeader label="Reports To" column="reports_to" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Availability" column="availability" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Skills</span>
              <SortHeader label="Activation" column="status" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</span>
            </div>
          </div>
          {filteredTeam.map((member) => (
            <TeamMemberRow
              key={member.id}
              profile={member}
              evaluationSummary={summaryMap.get(member.id)}
              additionalRoles={(rolesMap.get(member.user_id) ?? []).filter(r => r.role !== member.role)}
              managerName={member.reports_to ? nameMap.get(member.reports_to) ?? null : null}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
