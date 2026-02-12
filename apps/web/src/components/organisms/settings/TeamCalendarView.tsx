"use client";

import { useMemo, useState, useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Button } from "@/components/molecules/buttons/Button";
import { teamRepository } from "@/lib/api/repositories";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface TeamCalendarViewProps {
  profileId?: string;
  officeLocation?: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TeamCalendarView({ profileId, officeLocation }: TeamCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: teamHolidays = [], isLoading: loadingTeam } = useQuery({
    queryKey: ["team", "holidays", profileId],
    queryFn: () => teamRepository.getHolidays(profileId),
    enabled: !!profileId,
  });

  const { data: nationalHolidays = [], isLoading: loadingNational } = useQuery({
    queryKey: ["team", "national-holidays", officeLocation],
    queryFn: () => teamRepository.getNationalHolidays(officeLocation),
    enabled: !!officeLocation,
  });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startDayOffset = useMemo(() => getDay(startOfMonth(currentMonth)), [currentMonth]);

  const teamHolidaySet = useMemo(() => {
    const set = new Set<string>();
    teamHolidays.forEach((h) => {
      const start = new Date(h.start_date);
      const end = new Date(h.end_date);
      const range = eachDayOfInterval({ start, end });
      range.forEach((d) => set.add(format(d, "yyyy-MM-dd")));
    });
    return set;
  }, [teamHolidays]);

  const nationalHolidayMap = useMemo(() => {
    const map = new Map<string, string>();
    nationalHolidays.forEach((nh) => {
      map.set(nh.date.split("T")[0], nh.name);
    });
    return map;
  }, [nationalHolidays]);

  const prevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const nextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);

  const isLoading = loadingTeam || loadingNational;

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Team Calendar
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-200 border border-blue-400" />
            <span className="text-xs text-muted-foreground">Team Holiday</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-200 border border-red-400" />
            <span className="text-xs text-muted-foreground">National Holiday</span>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="bg-muted/50 text-center py-2 text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-background p-2 min-h-[60px]" />
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const isTeam = teamHolidaySet.has(key);
              const nationalName = nationalHolidayMap.get(key);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={key}
                  className={`bg-background p-1 min-h-[60px] ${
                    isTeam ? "bg-blue-50 dark:bg-blue-950/30" : ""
                  } ${nationalName ? "bg-red-50 dark:bg-red-950/30" : ""}`}
                >
                  <span
                    className={`text-xs ${
                      isToday
                        ? "font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center"
                        : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {nationalName && (
                    <Badge
                      variant="destructive"
                      className="text-[9px] px-1 py-0 mt-1 block truncate"
                    >
                      {nationalName}
                    </Badge>
                  )}
                  {isTeam && !nationalName && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1 py-0 mt-1 block"
                    >
                      Off
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
