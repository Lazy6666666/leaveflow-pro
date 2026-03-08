import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "hsl(216, 19%, 26%)",
  "hsl(215, 19%, 34%)",
  "hsl(215, 20%, 65%)",
  "hsl(215, 16%, 46%)",
  "hsl(217, 10%, 64%)",
];

const Reports = () => {
  const [statusData, setStatusData] = useState<{ name: string; count: number }[]>([]);
  const [typeData, setTypeData] = useState<{ name: string; count: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; requests: number }[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      // Status distribution
      const { data: requests } = await supabase.from("leave_requests").select("status, leave_type_id, created_at, leave_types(name)");

      if (requests) {
        const statusMap: Record<string, number> = {};
        const typeMap: Record<string, number> = {};
        const monthMap: Record<string, number> = {};

        requests.forEach((r: any) => {
          statusMap[r.status] = (statusMap[r.status] || 0) + 1;
          const typeName = r.leave_types?.name || "Unknown";
          typeMap[typeName] = (typeMap[typeName] || 0) + 1;
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
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground">Leave usage insights and trends</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requests by Status</CardTitle>
            <CardDescription>Distribution of leave request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests by Leave Type</CardTitle>
            <CardDescription>Usage across different leave categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(216, 19%, 26%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Leave requests over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="hsl(215, 19%, 34%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
