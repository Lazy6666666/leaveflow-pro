import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { PageHeaderSkeleton, CardSkeleton } from "@/components/skeletons";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "hsl(168, 56%, 34%)",
  "hsl(168, 40%, 50%)",
  "hsl(200, 55%, 50%)",
  "hsl(220, 20%, 60%)",
  "hsl(260, 40%, 55%)",
];

const Reports = () => {
  const [statusData, setStatusData] = useState<{ name: string; count: number }[]>([]);
  const [typeData, setTypeData] = useState<{ name: string; count: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; requests: number }[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const { data: requests } = await supabase.from("leave_requests").select("status, leave_type_id, created_at, leave_types(name)");
      if (requests) {
        const statusMap: Record<string, number> = {};
        const typeMap: Record<string, number> = {};
        const monthMap: Record<string, number> = {};
        requests.forEach((r: any) => {
          statusMap[r.status] = (statusMap[r.status] || 0) + 1;
          typeMap[r.leave_types?.name || "Unknown"] = (typeMap[r.leave_types?.name || "Unknown"] || 0) + 1;
          const month = new Date(r.created_at).toLocaleString("default", { month: "short", year: "numeric" });
          monthMap[month] = (monthMap[month] || 0) + 1;
        });
        setStatusData(Object.entries(statusMap).map(([name, count]) => ({ name, count })));
        setTypeData(Object.entries(typeMap).map(([name, count]) => ({ name, count })));
        setMonthlyData(Object.entries(monthMap).map(([month, requests]) => ({ month, requests })));
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Reports & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Leave usage insights and trends</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Requests by Status</CardTitle>
            <CardDescription>Distribution of leave request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Requests by Leave Type</CardTitle>
            <CardDescription>Usage across different leave categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="count" fill="hsl(168, 56%, 34%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Trends</CardTitle>
            <CardDescription>Leave requests over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="requests" fill="hsl(168, 40%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
