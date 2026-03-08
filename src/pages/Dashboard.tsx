import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { CalendarDays, PlusCircle, CheckSquare, Clock, CalendarHeart, ArrowRight, Users } from "lucide-react";
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
  "hsl(168, 56%, 34%)", // primary
  "hsl(210, 14%, 83%)", // muted
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
    ...(hasRole("manager") ? [{ label: "Approvals", desc: `${pendingCount} pending`, icon: CheckSquare, path: "/manager/approvals" }] : []),
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Card
            key={action.path}
            className="cursor-pointer group hover:shadow-md transition-all duration-200 hover:border-primary/30"
            onClick={() => navigate(action.path)}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-11 w-11 rounded-lg bg-accent flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <action.icon className="h-5 w-5 text-accent-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Balance + Holidays */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" /> Leave Balance
            </CardTitle>
            <CardDescription>{new Date().getFullYear()} overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {balances.length === 0 ? (
              <p className="text-muted-foreground text-sm">No leave balances found for this year.</p>
            ) : (
              <>
                {/* Donut Chart + Summary */}
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={32}
                          outerRadius={50}
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
                      <span className="text-xl font-bold text-foreground leading-none">{totalRemaining}</span>
                      <span className="text-[10px] text-muted-foreground">left</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[0] }} />
                      <span className="text-foreground font-medium">{totalRemaining} remaining</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[1] }} />
                      <span className="text-muted-foreground">{totalUsed} used of {totalAllocation}</span>
                    </div>
                  </div>
                </div>

                {/* Per-type breakdown */}
                <div className="space-y-3">
                  {balances.map((b) => {
                    const total = b.leave_types?.annual_allocation || 0;
                    const pct = total > 0 ? (b.balance / total) * 100 : 0;
                    return (
                      <div key={b.leave_type_id} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground font-medium">{b.leave_types?.name}</span>
                          <span className="text-muted-foreground tabular-nums">{b.balance} / {total}</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarHeart className="h-5 w-5 text-primary" /> Upcoming Holidays
            </CardTitle>
            <CardDescription>Next public holidays</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming holidays.</p>
            ) : (
              <div className="space-y-4">
                {upcomingHolidays.map((h) => (
                  <div key={h.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{h.name}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(h.date), "EEEE, MMMM d, yyyy")}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {(() => {
                        const days = Math.ceil((parseISO(h.date).getTime() - startOfToday().getTime()) / (1000 * 60 * 60 * 24));
                        if (days === 0) return "Today";
                        if (days === 1) return "Tomorrow";
                        return `In ${days} days`;
                      })()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate("/holidays")}
              className="text-sm text-primary hover:underline mt-5 flex items-center gap-1 font-medium"
            >
              View all holidays <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Team Availability */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" /> Team Availability
          </CardTitle>
          <CardDescription>Who's off this week ({format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d")} – {format(endOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d")})</CardDescription>
        </CardHeader>
        <CardContent>
          {teamAbsences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Everyone's in this week! 🎉</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamAbsences.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(a.profiles?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {a.profiles?.full_name || a.profiles?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.leave_types?.name} · {format(parseISO(a.start_date), "MMM d")} – {format(parseISO(a.end_date), "MMM d")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Recent Requests</h2>
        <Card>
          <CardContent className="p-0">
            {recentRequests.length === 0 ? (
              <p className="text-muted-foreground p-5">No requests yet.</p>
            ) : (
              <div className="divide-y">
                {recentRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-foreground text-sm">{req.leave_types?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(parseISO(req.start_date), "MMM d")} — {format(parseISO(req.end_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant={statusColor(req.status)} className="capitalize">{req.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
