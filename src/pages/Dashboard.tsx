import { useAuth } from "@/contexts/AuthContext";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays, PlusCircle, CheckSquare, Clock, CalendarHeart,
  ArrowRight, Users, TrendingUp, Sparkles,
} from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons";
import { ClockInOutWidget } from "@/components/attendance/ClockInOutWidget";
import { endOfWeek, parseISO, startOfToday, startOfWeek } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const DONUT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--muted))",
];

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const monthDayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});
const monthDayYearFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const weekdayMonthDayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const Dashboard = () => {
  const { user, hasExplicitRole, hasManagerAccess, hasRole } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => convex.query(api.leave.getDashboardData, {}),
    enabled: !!user,
    staleTime: STALE_TIME,
  });

  const balances = data?.balances ?? [];
  const recentRequests = data?.recentRequests ?? [];
  const upcomingHolidays = data?.upcomingHolidays ?? [];
  const teamAbsences = data?.teamAbsences ?? [];
  const pendingCount = data?.pendingCount ?? 0;

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "rejected": return "destructive";
      case "cancelled": return "secondary";
      default: return "outline";
    }
  };

  const totalAllocation = balances.reduce((sum, b) => sum + (b.leave_types?.annual_allocation || 0), 0);
  const totalRemaining = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalUsed = totalAllocation - totalRemaining;

  const donutData = [
    { name: "Remaining", value: totalRemaining },
    { name: "Used", value: totalUsed },
  ];
  const canAccessManagerOnlyTools = hasExplicitRole("manager") || hasExplicitRole("hr_admin");

  const quickActions = [
    { label: "Request Leave", desc: "Submit a new request", icon: PlusCircle, path: "/request-leave" },
    { label: "My Leave", desc: "View balances", icon: CalendarDays, path: "/my-leave" },
    { label: "History", desc: "View past requests", icon: Clock, path: "/leave-history" },
    { label: "Attendance", desc: "View attendance log", icon: CheckSquare, path: "/attendance" },
    { label: "Holidays", desc: "View public holidays", icon: CalendarHeart, path: "/holidays" },
    ...(hasManagerAccess ? [{ label: "Approvals", desc: `${pendingCount} pending`, icon: CheckSquare, path: "/manager/approvals" }] : []),
    ...(hasManagerAccess ? [{ label: "Team Calendar", desc: "View team schedule", icon: CalendarDays, path: "/manager/team-calendar" }] : []),
    ...(canAccessManagerOnlyTools ? [{ label: "Team Attendance", desc: "Daily status", icon: Users, path: "/manager/team-attendance" }] : []),
    ...(hasRole("hr_admin") ? [{ label: "Employees", desc: "Manage staff", icon: Users, path: "/admin/employees" }] : []),
    { label: "Profile", desc: "Edit your details", icon: Users, path: "/profile" },
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const firstName = data?.viewer.firstName || user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Greeting Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{fullDateFormatter.format(new Date())}</span>
        </div>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
          {greeting}, {firstName}
        </h1>
      </div>

      {/* Summary Stats Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <ClockInOutWidget />
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Total Balance</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{totalRemaining}</p>
            <p className="text-xs text-muted-foreground mt-1">of {totalAllocation} days</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Days Used</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{totalUsed}</p>
            <p className="text-xs text-muted-foreground mt-1">this year</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Next Holiday</p>
            {upcomingHolidays.length > 0 ? (
              <>
                <p className="text-lg font-semibold text-foreground leading-tight">{upcomingHolidays[0].name}</p>
                <p className="text-xs text-muted-foreground mt-1">{monthDayFormatter.format(parseISO(upcomingHolidays[0].date))}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">None upcoming</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Team Status</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{teamAbsences.length}</p>
            <p className="text-xs text-muted-foreground mt-1">out this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              aria-label={`${action.label}: ${action.desc}`}
              className="group flex items-center gap-3.5 rounded-xl border border-border/60 bg-card p-4 text-left transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-sm"
            >
              <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/8 transition-colors">
                <action.icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Leave Balance — spans 3 */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-foreground">Leave Balance</CardTitle>
                <Link to="/my-leave" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View details <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {balances.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No leave balances found for this year.</p>
              ) : (
                <>
                  <p className="sr-only">
                    Leave balance summary: {totalRemaining} days remaining out of {totalAllocation}, with {totalUsed} days used.
                  </p>
                  <div className="flex items-center gap-8">
                    <div className="relative w-32 h-32 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={56}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {donutData.map((_, idx) => (
                              <Cell key={idx} fill={DONUT_COLORS[idx]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string) => [`${value} days`, name]}
                            contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-semibold text-foreground leading-none">{totalRemaining}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">remaining</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-foreground">{totalRemaining} days remaining</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                        <span className="text-muted-foreground">{totalUsed} days used</span>
                      </div>
                      {totalAllocation > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                          <TrendingUp className="h-3 w-3" aria-hidden="true" />
                          <span>{Math.round((totalRemaining / totalAllocation) * 100)}% remaining</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {balances.map((b) => {
                      const total = b.leave_types?.annual_allocation || 0;
                      const pct = total > 0 ? (b.balance / total) * 100 : 0;
                      return (
                        <div key={b.leave_type_id} className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-foreground">{b.leave_types?.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{b.balance} / {total}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Requests */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-foreground">Recent Requests</CardTitle>
                <Link to="/leave-history" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentRequests.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No requests yet.</p>
              ) : (
                <div className="space-y-1">
                  {recentRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                      <div>
                        <p className="text-sm text-foreground">{req.leave_types?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {monthDayFormatter.format(parseISO(req.start_date))} – {monthDayYearFormatter.format(parseISO(req.end_date))}
                        </p>
                      </div>
                      <Badge variant={statusColor(req.status)} className="capitalize text-xs">{req.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — spans 2 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Holidays */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-foreground">Upcoming Holidays</CardTitle>
                <Link to="/holidays" className="text-xs text-primary hover:underline flex items-center gap-1">
                  All holidays <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingHolidays.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No upcoming holidays.</p>
              ) : (
                <div className="space-y-1">
                  {upcomingHolidays.map((h) => {
                    const days = Math.ceil((parseISO(h.date).getTime() - startOfToday().getTime()) / (1000 * 60 * 60 * 24));
                    const label = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`;
                    return (
                      <div key={h.id} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                        <div>
                          <p className="text-sm text-foreground">{h.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{weekdayMonthDayFormatter.format(parseISO(h.date))}</p>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums bg-muted/60 px-2 py-0.5 rounded-md">{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Availability */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-foreground">Team This Week</CardTitle>
              <p className="text-xs text-muted-foreground">
                {monthDayFormatter.format(startOfWeek(new Date(), { weekStartsOn: 1 }))} – {monthDayFormatter.format(endOfWeek(new Date(), { weekStartsOn: 1 }))}
              </p>
            </CardHeader>
            <CardContent>
              {teamAbsences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/8 flex items-center justify-center mb-3">
                    <Users className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted-foreground">Everyone's in this week</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {teamAbsences.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {getInitials(a.profiles?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">
                          {a.profiles?.full_name || a.profiles?.email || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.leave_types?.name} · {monthDayFormatter.format(parseISO(a.start_date))}–{monthDayFormatter.format(parseISO(a.end_date))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
