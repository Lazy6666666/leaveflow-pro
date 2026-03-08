import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, PlusCircle, CheckSquare, Clock, CalendarHeart,
  ArrowRight, Users, TrendingUp, Sparkles,
} from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons";
import { format, parseISO, startOfToday, endOfWeek, startOfWeek } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface LeaveBalance {
  balance: number;
  leave_type_id: string;
  year: number;
  leave_types: { name: string; annual_allocation: number } | null;
}

interface RecentRequest {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  leave_types: { name: string } | null;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
}

interface TeamAbsence {
  id: string;
  start_date: string;
  end_date: string;
  profiles: { full_name: string | null; email: string | null } | null;
  leave_types: { name: string } | null;
}

const DONUT_COLORS = [
  "hsl(168, 56%, 34%)",
  "hsl(220, 14%, 83%)",
];

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);
  const [teamAbsences, setTeamAbsences] = useState<TeamAbsence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const currentYear = new Date().getFullYear();
    const today = format(startOfToday(), "yyyy-MM-dd");
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

    const fetchAll = async () => {
      setLoading(true);
      const [balRes, recRes, holRes, teamRes] = await Promise.all([
        supabase
          .from("leave_balances")
          .select("balance, leave_type_id, year, leave_types(name, annual_allocation)")
          .eq("employee_id", user.id)
          .eq("year", currentYear),
        supabase
          .from("leave_requests")
          .select("id, start_date, end_date, status, leave_types(name)")
          .eq("employee_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("public_holidays")
          .select("id, name, date")
          .gte("date", today)
          .order("date")
          .limit(5),
        supabase
          .from("leave_requests")
          .select("id, start_date, end_date, profiles:employee_id(full_name, email), leave_types(name)")
          .eq("status", "approved")
          .lte("start_date", weekEnd)
          .gte("end_date", weekStart)
          .limit(20),
      ]);
      if (balRes.data) setBalances(balRes.data as unknown as LeaveBalance[]);
      if (recRes.data) setRecentRequests(recRes.data as unknown as RecentRequest[]);
      if (holRes.data) setUpcomingHolidays(holRes.data);
      if (teamRes.data) setTeamAbsences(teamRes.data as unknown as TeamAbsence[]);

      if (hasRole("manager")) {
        const { count } = await supabase
          .from("leave_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");
        setPendingCount(count || 0);
      }
    };
    fetchAll().finally(() => setLoading(false));
  }, [user, hasRole]);

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

  const quickActions = [
    { label: "Request Leave", desc: "Submit a new request", icon: PlusCircle, path: "/request-leave" },
    { label: "My Leave", desc: "View balances", icon: CalendarDays, path: "/my-leave" },
    { label: "History", desc: "View past requests", icon: Clock, path: "/leave-history" },
    { label: "Holidays", desc: "View public holidays", icon: CalendarHeart, path: "/holidays" },
    ...(hasRole("manager") ? [{ label: "Approvals", desc: `${pendingCount} pending`, icon: CheckSquare, path: "/manager/approvals" }] : []),
    ...(hasRole("manager") ? [{ label: "Team Calendar", desc: "View team schedule", icon: CalendarDays, path: "/manager/team-calendar" }] : []),
    ...(hasRole("hr_admin") ? [{ label: "Employees", desc: "Manage staff", icon: Users, path: "/admin/employees" }] : []),
    { label: "Profile", desc: "Edit your details", icon: Users, path: "/profile" },
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Greeting Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
        </div>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
          {greeting}, {firstName}
        </h1>
      </div>

      {/* Summary Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
                <p className="text-xs text-muted-foreground mt-1">{format(parseISO(upcomingHolidays[0].date), "MMM d")}</p>
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
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group flex items-center gap-3.5 rounded-xl border border-border/60 bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
            >
              <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/8 transition-colors">
                <action.icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </button>
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
                <button
                  onClick={() => navigate("/my-leave")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View details <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {balances.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No leave balances found for this year.</p>
              ) : (
                <>
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
                          <TrendingUp className="h-3 w-3" />
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
                <button
                  onClick={() => navigate("/leave-history")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
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
                          {format(parseISO(req.start_date), "MMM d")} – {format(parseISO(req.end_date), "MMM d, yyyy")}
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
                <button
                  onClick={() => navigate("/holidays")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  All holidays <ArrowRight className="h-3 w-3" />
                </button>
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
                          <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(h.date), "EEE, MMM d")}</p>
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
                {format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d")} – {format(endOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d")}
              </p>
            </CardHeader>
            <CardContent>
              {teamAbsences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/8 flex items-center justify-center mb-3">
                    <Users className="h-4.5 w-4.5 text-primary" />
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
                          {a.leave_types?.name} · {format(parseISO(a.start_date), "MMM d")}–{format(parseISO(a.end_date), "MMM d")}
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
