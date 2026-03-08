import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { CalendarDays, PlusCircle, CheckSquare, Clock } from "lucide-react";

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

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const currentYear = new Date().getFullYear();

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

    fetchBalances();
    fetchRecent();
    fetchPendingCount();
  }, [user, hasRole]);

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "rejected": return "destructive";
      case "cancelled": return "secondary";
      default: return "outline";
    }
  };

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

      {/* Leave Balances */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Leave Balances</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {balances.map((b) => {
            const total = b.leave_types?.annual_allocation || 0;
            const used = total - b.balance;
            const pct = total > 0 ? (b.balance / total) * 100 : 0;
            return (
              <Card key={b.leave_type_id}>
                <CardHeader className="pb-2">
                  <CardDescription>{b.leave_types?.name}</CardDescription>
                  <CardTitle className="text-2xl">{b.balance}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{used} used of {total}</p>
                </CardContent>
              </Card>
            );
          })}
          {balances.length === 0 && (
            <p className="text-muted-foreground col-span-full">No leave balances found for this year.</p>
          )}
        </div>
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
