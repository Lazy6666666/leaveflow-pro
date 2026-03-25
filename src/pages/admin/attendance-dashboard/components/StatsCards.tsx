import { Card, CardContent } from "@/components/ui/card";

import type { AttendanceStats } from "../types";

type StatsCardsProps = {
  stats: AttendanceStats;
};

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[
        { label: "Total Records", value: stats.total, muted: false },
        { label: "Present", value: stats.present, muted: false },
        { label: "Late", value: stats.late, muted: false },
        { label: "Absent", value: stats.absent, muted: true },
      ].map((card) => (
        <Card key={card.label}>
          <CardContent className="p-5">
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{card.label}</p>
            <p className={`text-3xl font-semibold tabular-nums ${card.muted ? "text-muted-foreground" : "text-foreground"}`}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

