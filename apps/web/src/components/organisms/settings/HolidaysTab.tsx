"use client";

import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { Separator } from "@/components/atoms/layout/Separator";
import { Button } from "@/components/molecules/buttons/Button";
import { teamRepository } from "@/lib/api/repositories";
import type { Profile, TeamHoliday, NationalHoliday } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface HolidaysTabProps {
  className?: string;
  currentProfile?: Profile | null;
  calendarView?: React.ReactNode;
  nationalManagement?: React.ReactNode;
  isAdmin?: boolean;
}

type OfficeLocation = "lahore" | "dubai" | "uk" | "europe";

const OFFICE_LOCATIONS: { value: OfficeLocation; label: string; country: string }[] = [
  { value: "lahore", label: "Lahore", country: "Pakistan" },
  { value: "dubai", label: "Dubai", country: "UAE" },
  { value: "uk", label: "United Kingdom", country: "UK" },
  { value: "europe", label: "Europe", country: "EU" },
];

function useTeamHolidays(profileId: string | undefined) {
  return useQuery({
    queryKey: ["team", "holidays", profileId],
    queryFn: () => teamRepository.getHolidays(profileId),
    enabled: !!profileId,
  });
}

function useNationalHolidays(location: string) {
  return useQuery({
    queryKey: ["team", "national-holidays", location],
    queryFn: () => teamRepository.getNationalHolidays(location),
  });
}

function useHolidayMutations() {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (data: Partial<TeamHoliday>) => teamRepository.createHoliday(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team", "holidays"] }); toast.success("Holiday booked"); },
    onError: () => { toast.error("Failed to book holiday"); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => teamRepository.deleteHoliday(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team", "holidays"] }); toast.success("Holiday removed"); },
  });
  return { create, remove };
}

export function HolidaysTab({ className, currentProfile, calendarView, nationalManagement, isAdmin = false }: HolidaysTabProps) {
  const officeLocation = (currentProfile?.office_location as OfficeLocation) || "lahore";
  const { data: myHolidays, isLoading: holidaysLoading } = useTeamHolidays(currentProfile?.id);
  const { data: nationalHolidays, isLoading: nationalLoading } = useNationalHolidays(officeLocation);
  const { create: createHoliday, remove: deleteHoliday } = useHolidayMutations();
  const [newHoliday, setNewHoliday] = useState({ start_date: "", end_date: "", reason: "" });
  const currentLocation = useMemo(() => OFFICE_LOCATIONS.find((l) => l.value === officeLocation), [officeLocation]);

  const handleAddHoliday = useCallback(() => {
    if (!currentProfile || !newHoliday.start_date || !newHoliday.end_date) return;
    createHoliday.mutate(
      { profile_id: currentProfile.id, start_date: newHoliday.start_date, end_date: newHoliday.end_date, reason: newHoliday.reason || undefined },
      { onSuccess: () => setNewHoliday({ start_date: "", end_date: "", reason: "" }) },
    );
  }, [currentProfile, newHoliday, createHoliday]);

  return (
    <div className={className}>
      <div className="space-y-6">
        {calendarView}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2"><MapPin className="h-5 w-5" />Office Location</h3>
            <p className="text-sm text-muted-foreground">Set your office location to see relevant national holidays</p>
          </div>
          <div className="px-6 pb-6 flex items-center gap-4">
            <select value={officeLocation} className="h-10 w-full max-w-xs rounded-md border bg-background px-3 text-sm" disabled>
              {OFFICE_LOCATIONS.map((loc) => <option key={loc.value} value={loc.value}>{loc.label} ({loc.country})</option>)}
            </select>
            {currentLocation && <Badge variant="secondary">{currentLocation.country} holidays apply</Badge>}
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="h-5 w-5" />My Holidays</h3>
            <p className="text-sm text-muted-foreground">Book your time off. These dates will be flagged when tasks are assigned to you.</p>
          </div>
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <BaseLabel htmlFor="holiday-start">Start Date</BaseLabel>
                <BaseInput id="holiday-start" type="date" value={newHoliday.start_date} onChange={(e) => setNewHoliday({ ...newHoliday, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <BaseLabel htmlFor="holiday-end">End Date</BaseLabel>
                <BaseInput id="holiday-end" type="date" value={newHoliday.end_date} min={newHoliday.start_date} onChange={(e) => setNewHoliday({ ...newHoliday, end_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <BaseLabel htmlFor="holiday-reason">Reason (optional)</BaseLabel>
                <BaseInput id="holiday-reason" placeholder="e.g., Annual leave" value={newHoliday.reason} onChange={(e) => setNewHoliday({ ...newHoliday, reason: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddHoliday} disabled={!newHoliday.start_date || !newHoliday.end_date || createHoliday.isPending} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />Book Holiday
                </Button>
              </div>
            </div>
            <Separator />
            {holidaysLoading ? (
              <p className="text-sm text-muted-foreground">Loading holidays...</p>
            ) : myHolidays && myHolidays.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium">Start Date</th>
                      <th className="text-left py-3 px-4 font-medium">End Date</th>
                      <th className="text-left py-3 px-4 font-medium">Reason</th>
                      <th className="w-[80px] py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myHolidays.map((h) => (
                      <tr key={h.id} className="border-b">
                        <td className="py-3 px-4">{format(new Date(h.start_date), "MMM d, yyyy")}</td>
                        <td className="py-3 px-4">{format(new Date(h.end_date), "MMM d, yyyy")}</td>
                        <td className="py-3 px-4">{h.reason ?? "-"}</td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="icon" onClick={() => deleteHoliday.mutate(h.id)} disabled={deleteHoliday.isPending}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No holidays booked yet</p>
            )}
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold">National Holidays ({currentLocation?.country ?? "Pakistan"})</h3>
            <p className="text-sm text-muted-foreground">Public holidays for your office location. Automatically factored into deadline calculations.</p>
          </div>
          <div className="px-6 pb-6">
            {nationalLoading ? (
              <p className="text-sm text-muted-foreground">Loading holidays...</p>
            ) : nationalHolidays && nationalHolidays.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {nationalHolidays.map((nh) => {
                  const d = new Date(nh.date);
                  const isPast = d < new Date();
                  return (
                    <div key={nh.id} className={`p-3 rounded-lg border ${isPast ? "opacity-50 bg-muted/30" : "bg-card"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{nh.name}</span>
                        {nh.recurring && <Badge variant="outline" className="text-xs">Yearly</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{format(d, "EEEE, MMMM d, yyyy")}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No national holidays found for this location</p>
            )}
          </div>
        </Card>
        {isAdmin && nationalManagement}
      </div>
    </div>
  );
}
