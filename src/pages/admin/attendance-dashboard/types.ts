export type AttendanceView = "today" | "month";

export type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export type AttendanceStats = {
  total: number;
  present: number;
  late: number;
  absent: number;
};

