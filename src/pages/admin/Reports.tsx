import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download } from "lucide-react";
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
  const [attendanceData, setAttendanceData] = useState<{ name: string; count: number }[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const [reqRes, attRes] = await Promise.all([
        supabase.from("leave_requests").select("status, leave_type_id, created_at, leave_types(name)"),
        supabase.from("attendance_logs").select("status, date"),
      ]);

      if (reqRes.data) {
        const statusMap: Record<string, number> = {};
        const typeMap: Record<string, number> = {};
        const monthMap: Record<string, number> = {};
        reqRes.data.forEach((r: any) => {
          statusMap[r.status] = (statusMap[r.status] || 0) + 1;
          typeMap[r.leave_types?.name || "Unknown"] = (typeMap[r.leave_types?.name || "Unknown"] || 0) + 1;
          const month = new Date(r.created_at).toLocaleString("default", { month: "short", year: "numeric" });
          monthMap[month] = (monthMap[month] || 0) + 1;
        });
        setStatusData(Object.entries(statusMap).map(([name, count]) => ({ name, count })));
        setTypeData(Object.entries(typeMap).map(([name, count]) => ({ name, count })));
        setMonthlyData(Object.entries(monthMap).map(([month, requests]) => ({ month, requests })));
      }

      if (attRes.data) {
        const attMap: Record<string, number> = {};
        attRes.data.forEach((a: any) => {
          const label = (a.status as string).replace("_", " ");
          attMap[label] = (attMap[label] || 0) + 1;
        });
        setAttendanceData(Object.entries(attMap).map(([name, count]) => ({ name, count })));
      }
    };
    fetchReports().finally(() => setPageLoading(false));
  }, []);

  const exportCSV = () => {
    let csv = "Section,Category,Count\n";
    statusData.forEach((d) => (csv += `"Leave Status","${d.name}",${d.count}\n`));
    typeData.forEach((d) => (csv += `"Leave Type","${d.name}",${d.count}\n`));
    attendanceData.forEach((d) => (csv += `"Attendance","${d.name}",${d.count}\n`));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "reports.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (pageLoading) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton lines={6} />
        <CardSkeleton lines={6} />
      </div>
      <CardSkeleton lines={8} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Leave and attendance insights</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Attendance Overview</CardTitle>
            <CardDescription>Attendance status distribution across all logs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={attendanceData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {attendanceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Leave Trends</CardTitle>
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
