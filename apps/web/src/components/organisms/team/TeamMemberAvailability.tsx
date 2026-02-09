"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { useTeamHolidays } from "@/hooks/queries/useTeamHolidays";
import { Calendar } from "lucide-react";
import type { TeamHoliday } from "@/lib/types";

interface TeamMemberAvailabilityProps {
  profileId: string;
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date();
}

function TeamMemberAvailability({ profileId }: TeamMemberAvailabilityProps) {
  const { data: holidays = [], isLoading } = useTeamHolidays();

  const memberHolidays = holidays.filter(
    (h: TeamHoliday) => h.profile_id === profileId,
  );
  const upcoming = memberHolidays.filter((h: TeamHoliday) =>
    isUpcoming(h.end_date),
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              Available
            </Badge>
            <span className="text-sm text-muted-foreground">
              No upcoming time off
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((holiday: TeamHoliday) => (
              <div
                key={holiday.id}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="space-y-0.5">
                  <span className="text-sm">{holiday.reason ?? "Time off"}</span>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {new Date(holiday.start_date).toLocaleDateString()} -{" "}
                    {new Date(holiday.end_date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Scheduled
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { TeamMemberAvailability };
export type { TeamMemberAvailabilityProps };
