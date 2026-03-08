import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { CalendarDays, PlusCircle, CheckSquare, Clock, CalendarHeart, ArrowRight } from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons";
import { format, parseISO, startOfToday } from "date-fns";

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

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const currentYear = new Date().getFullYear();
    const today = format(startOfToday(), "yyyy-MM-dd");

    const fetchAll = async () => {
      setLoading(true);
      const [balRes, recRes, holRes] = await Promise.all([
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
      ]);
      if (balRes.data) setBalances(balRes.data as unknown as LeaveBalance[]);
      if (recRes.data) setRecentRequests(recRes.data as unknown as RecentRequest[]);
      if (holRes.data) setUpcomingHolidays(holRes.data);

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

  const quickActions = [
    { label: "Request Leave", desc: "Submit a new request", icon: PlusCircle, path: "/request-leave" },
    { label: "My Leave", desc: "View balances", icon: CalendarDays, path: "/my-leave" },
    { label: "History", desc: "View past requests", icon: Clock, path: "/leave-history" },
    ...(hasRole("manager") ? [{ label: "Approvals", desc: `${pendingCount} pending`, icon: CheckSquare, path: "/manager/approvals" }] : []),
  ];

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
                <div className="flex items-baseline gap-6">
                  <div>
                    <p className="text-4xl font-bold text-foreground">{totalRemaining}</p>
                    <p className="text-xs text-muted-foreground mt-1">days remaining</p>
                  </div>
                  <div className="text-muted-foreground">
                    <p className="text-xl font-semibold">{totalUsed}</p>
                    <p className="text-xs">used of {totalAllocation}</p>
                  </div>
                </div>
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
