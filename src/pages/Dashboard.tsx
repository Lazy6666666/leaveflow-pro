import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { CalendarDays, PlusCircle, CheckSquare, Clock, CalendarHeart } from "lucide-react";
import { format, parseISO, isAfter, startOfToday } from "date-fns";

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

  useEffect(() => {
    if (!user) return;
    const currentYear = new Date().getFullYear();
    const today = format(startOfToday(), "yyyy-MM-dd");

    const fetchBalances = async () => {
      const { data } = await supabase
        .from("leave_balances")
        .select("balance, leave_type_id, year, leave_types(name, annual_allocation)")
        .eq("employee_id", user.id)
        .eq("year", currentYear);
      if (data) setBalances(data as unknown as LeaveBalance[]);
    };

    const fetchRecent = async () => {
      const { data } = await supabase
        .from("leave_requests")
        .select("id, start_date, end_date, status, leave_types(name)")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setRecentRequests(data as unknown as RecentRequest[]);
    };

    const fetchPendingCount = async () => {
      if (hasRole("manager")) {
        const { count } = await supabase
          .from("leave_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");
        setPendingCount(count || 0);
      }
    };

    const fetchHolidays = async () => {
      const { data } = await supabase
        .from("public_holidays")
        .select("id, name, date")
        .gte("date", today)
        .order("date")
        .limit(5);
      if (data) setUpcomingHolidays(data);
    };

    fetchBalances();
    fetchRecent();
    fetchPendingCount();
    fetchHolidays();
  }, [user, hasRole]);

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "rejected": return "destructive";
      case "cancelled": return "secondary";
      default: return "outline";
    }
  };

  // Compute balance summary
  const totalAllocation = balances.reduce((sum, b) => sum + (b.leave_types?.annual_allocation || 0), 0);
  const totalRemaining = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalUsed = totalAllocation - totalRemaining;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/request-leave")}>
          <CardContent className="flex items-center gap-3 p-4">
            <PlusCircle className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-foreground">Request Leave</p>
              <p className="text-xs text-muted-foreground">Submit a new request</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/my-leave")}>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarDays className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-foreground">My Leave</p>
              <p className="text-xs text-muted-foreground">View balances</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/leave-history")}>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-foreground">History</p>
              <p className="text-xs text-muted-foreground">View past requests</p>
            </div>
          </CardContent>
        </Card>
        {hasRole("manager") && (
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/manager/approvals")}>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-foreground">Approvals</p>
                <p className="text-xs text-muted-foreground">{pendingCount} pending</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Balance Summary + Upcoming Holidays */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leave Balance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Leave Balance Summary
            </CardTitle>
            <CardDescription>{new Date().getFullYear()} overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {balances.length === 0 ? (
              <p className="text-muted-foreground text-sm">No leave balances found for this year.</p>
            ) : (
              <>
                <div className="flex items-baseline gap-4 mb-4">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{totalRemaining}</p>
                    <p className="text-xs text-muted-foreground">days remaining</p>
                  </div>
                  <div className="text-muted-foreground">
                    <p className="text-lg font-semibold">{totalUsed}</p>
                    <p className="text-xs">used of {totalAllocation}</p>
                  </div>
                </div>
                {balances.map((b) => {
                  const total = b.leave_types?.annual_allocation || 0;
                  const pct = total > 0 ? (b.balance / total) * 100 : 0;
                  return (
                    <div key={b.leave_type_id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{b.leave_types?.name}</span>
                        <span className="text-muted-foreground">{b.balance} / {total}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarHeart className="h-5 w-5" /> Upcoming Holidays
            </CardTitle>
            <CardDescription>Next public holidays</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming holidays.</p>
            ) : (
              <div className="space-y-3">
                {upcomingHolidays.map((h) => (
                  <div key={h.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{h.name}</p>
                      <p className="text-sm text-muted-foreground">{format(parseISO(h.date), "EEEE, MMMM d, yyyy")}</p>
                    </div>
                    <Badge variant="secondary">
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
              className="text-sm text-primary hover:underline mt-4 block"
            >
              View all holidays →
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
              <p className="text-muted-foreground p-4">No requests yet.</p>
            ) : (
              <div className="divide-y">
                {recentRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-foreground">{req.leave_types?.name}</p>
                      <p className="text-sm text-muted-foreground">{req.start_date} — {req.end_date}</p>
                    </div>
                    <Badge variant={statusColor(req.status)}>{req.status}</Badge>
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
