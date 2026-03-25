import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWithinInterval, parseISO, addMonths, subMonths, isToday } from "date-fns";
import { PageHeaderSkeleton, CardSkeleton } from "@/components/skeletons";
import type { FunctionReturnType } from "convex/server";
import { useAnalytics } from "@/hooks/useAnalytics";

type TeamLeave = FunctionReturnType<typeof api.leave.getTeamCalendar>[number];

const TeamCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaves, setLeaves] = useState<TeamLeave[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const { trackOnce } = useAnalytics();

  useEffect(() => {
    const fetchLeaves = async () => {
      const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const data = await convex.query(api.leave.getTeamCalendar, { startDate: monthStart, endDate: monthEnd });
      if (data) setLeaves(data);
    };
    fetchLeaves().finally(() => setPageLoading(false));
  }, [currentMonth]);

  useEffect(() => {
    if (!pageLoading) {
      void trackOnce(`team_calendar_viewed:${format(currentMonth, "yyyy-MM")}`, "team_calendar_viewed", {
        month: format(currentMonth, "yyyy-MM"),
        visible_event_count: leaves.length,
      }, { surface: "manager", path: "/manager/team-calendar" });
    }
  }, [currentMonth, leaves.length, pageLoading, trackOnce]);

  if (pageLoading) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardSkeleton lines={10} />
    </div>
  );

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const getLeavesForDay = (day: Date) =>
    leaves.filter((l) => isWithinInterval(day, { start: parseISO(l.start_date), end: parseISO(l.end_date) }));

  const startDay = startOfMonth(currentMonth).getDay();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Manager</p>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground flex items-center gap-2">
          <CalendarRange className="h-6 w-6 text-foreground" /> Team Calendar
        </h1>
        <p className="text-sm text-muted-foreground">View approved team leaves.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="bg-muted/50 p-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {d}
              </div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-card p-2 min-h-[90px]" />
            ))}
            {days.map((day) => {
              const dayLeaves = getLeavesForDay(day);
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`bg-card p-2 min-h-[90px] transition-colors ${today ? "ring-2 ring-primary/30 ring-inset" : ""} ${!isSameMonth(day, currentMonth) ? "opacity-40" : ""}`}
                >
                  <span className={`text-sm font-medium ${today ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayLeaves.slice(0, 2).map((leave) => (
                      <Badge key={leave.id} variant="secondary" className="text-[10px] w-full truncate block py-0 px-1 h-5">
                        {leave.profiles?.full_name}
                      </Badge>
                    ))}
                    {dayLeaves.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{dayLeaves.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamCalendar;
