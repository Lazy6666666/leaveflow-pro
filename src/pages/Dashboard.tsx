import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { endOfWeek, parseISO, startOfToday, startOfWeek } from "date-fns";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Sparkles,
  Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";

import { ClockInOutWidget } from "@/components/attendance/ClockInOutWidget";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardSkeleton } from "@/components/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";

const DONUT_COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];
const STALE_TIME = 5 * 60 * 1000;
const cardShellClass = "rounded-2xl border bg-card text-card-foreground shadow-sm";

const revealItem = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const monthDayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});
const monthDayYearFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const weekdayMonthDayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const Dashboard = () => {
  const { user, hasManagerAccess } = useAuth();
  const { trackOnce } = useAnalytics();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => convex.query(api.leave.getDashboardData, {}),
    enabled: !!user,
    staleTime: STALE_TIME,
  });

  const balances = data?.balances ?? [];
  const recentRequests = data?.recentRequests ?? [];
  const upcomingHolidays = data?.upcomingHolidays ?? [];
  const teamAbsences = data?.teamAbsences ?? [];
  const pendingCount = data?.pendingCount ?? 0;

  const totalAllocation = balances.reduce((sum, balance) => sum + (balance.leave_types?.annual_allocation || 0), 0);
  const totalRemaining = balances.reduce((sum, balance) => sum + balance.balance, 0);
  const totalUsed = totalAllocation - totalRemaining;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    data?.viewer.firstName ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "approved";
      case "rejected": return "rejected";
      case "cancelled": return "cancelled";
      default: return "pending";
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  };

  const donutData = [
    { name: "Remaining", value: totalRemaining },
    { name: "Used", value: totalUsed },
  ];

  useEffect(() => {
    if (!isLoading && data && user?.id) {
      void trackOnce(`dashboard_viewed:${user.id}`, "dashboard_viewed", {
        pending_count: pendingCount,
        has_manager_access: hasManagerAccess,
      }, { surface: "dashboard", path: "/dashboard" });
    }
  }, [data, hasManagerAccess, isLoading, pendingCount, trackOnce, user?.id]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{fullDateFormatter.format(new Date())}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          {greeting}, {firstName}
        </h1>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-8">
          <motion.div variants={revealItem} initial="hidden" animate="show">
            <ClockInOutWidget />
          </motion.div>

          <motion.div variants={revealItem} initial="hidden" animate="show">
            <Card className={cardShellClass}>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <CardTitle className="text-base font-semibold">Leave Balance</CardTitle>
                <Link to="/my-leave" className="text-sm font-medium text-primary hover:underline group flex items-center gap-1.5">
                  View all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </CardHeader>
              <CardContent className="pt-6">
                {balances.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leave balances found for this year.</p>
                ) : (
                  <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                    <div className="relative h-32 w-32 shrink-0 max-sm:mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={56}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {donutData.map((_, index) => (
                              <Cell key={index} fill={DONUT_COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string) => [`${value} days`, name]}
                            contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold tabular-nums text-foreground">{totalRemaining}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">remaining</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-6">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-2xl font-semibold tabular-nums leading-none">{totalRemaining}</p>
                          <p className="mt-1 text-xs text-muted-foreground font-medium">Available Days</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold tabular-nums leading-none">{totalUsed}</p>
                          <p className="mt-1 text-xs text-muted-foreground font-medium">Used Days</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {balances.slice(0, 3).map((balance) => {
                          const total = balance.leave_types?.annual_allocation || 0;
                          const percentage = total > 0 ? (balance.balance / total) * 100 : 0;
                          return (
                            <div key={balance.leave_type_id} className="space-y-1.5">
                              <div className="flex items-baseline justify-between text-sm">
                                <span className="font-medium text-foreground">{balance.leave_types?.name}</span>
                                <span className="tabular-nums text-muted-foreground">
                                  {balance.balance} / {total}
                                </span>
                              </div>
                              <Progress value={percentage} className="h-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={revealItem} initial="hidden" animate="show">
            <Card className={cardShellClass}>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <CardTitle className="text-base font-semibold">Recent Requests</CardTitle>
                <Link to="/my-leave" className="text-sm font-medium text-primary hover:underline group flex items-center gap-1.5">
                  History <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                {recentRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-foreground">No recent requests</p>
                    <p className="text-xs text-muted-foreground mt-1">When you request time off, it will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentRequests.slice(0, 4).map((request) => (
                      <div key={request.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{request.leave_types?.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {monthDayFormatter.format(parseISO(request.start_date))} - {monthDayYearFormatter.format(parseISO(request.end_date))}
                          </p>
                        </div>
                        <Badge variant={statusColor(request.status) as "default" | "secondary" | "destructive" | "outline"} className="w-fit text-xs capitalize shadow-none">
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Side Column */}
        <div className="space-y-6 lg:col-span-4">
          <motion.div variants={revealItem} initial="hidden" animate="show">
            <Card className={cardShellClass}>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-base font-semibold">Upcoming Holidays</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {upcomingHolidays.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No upcoming holidays.</p>
                ) : (
                  <div className="divide-y">
                    {upcomingHolidays.slice(0, 5).map((holiday) => {
                      const days = Math.ceil((parseISO(holiday.date).getTime() - startOfToday().getTime()) / (1000 * 60 * 60 * 24));
                      const label = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;

                      return (
                        <div key={holiday.id} className="flex flex-col gap-1 py-3.5">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{holiday.name}</p>
                            <span className="text-xs font-medium text-muted-foreground">{label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {weekdayMonthDayFormatter.format(parseISO(holiday.date))}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={revealItem} initial="hidden" animate="show">
            <Card className={cardShellClass}>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-base font-semibold">Team Absent</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {monthDayFormatter.format(startOfWeek(new Date(), { weekStartsOn: 1 }))} - {monthDayFormatter.format(endOfWeek(new Date(), { weekStartsOn: 1 }))}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {teamAbsences.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Everyone is in this week</p>
                  </div>
                ) : (
                  <div className="divide-y mt-2">
                    {teamAbsences.map((absence) => (
                      <div key={absence.id} className="flex items-center gap-3 py-3">
                        <Avatar className="h-8 w-8 border">
                          <AvatarFallback className="bg-muted text-xs text-muted-foreground font-medium">
                            {getInitials(absence.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {absence.profiles?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {monthDayFormatter.format(parseISO(absence.start_date))} - {monthDayFormatter.format(parseISO(absence.end_date))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
