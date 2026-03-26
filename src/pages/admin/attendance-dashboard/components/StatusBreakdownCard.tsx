import { BarChart3 } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { AttendanceStats } from "../types";

type StatusBreakdownCardProps = {
  stats: AttendanceStats;
};

export function StatusBreakdownCard({ stats }: StatusBreakdownCardProps) {
  const chartData = [
    { name: "Present", value: stats.present, color: "hsl(var(--foreground))" },
    { name: "Late", value: stats.late, color: "hsl(var(--muted-foreground))" },
    { name: "Absent", value: stats.absent, color: "hsl(var(--border))" },
  ];

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
          <BarChart3 className="h-4 w-4" />
          Status Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

