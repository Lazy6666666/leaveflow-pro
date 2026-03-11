import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { endOfWeek, parseISO, startOfToday, startOfWeek } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  CalendarHeart,
  CheckSquare,
  Clock,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";

import { ClockInOutWidget } from "@/components/attendance/ClockInOutWidget";
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
const cardShellClass = "glass glass-panel rounded-[1.75rem] border border-white/10 bg-white/10 shadow-xl dark:bg-white/5";
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};
const revealItem = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 220, damping: 22 },
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
  const { user, hasExplicitRole, hasManagerAccess, hasRole } = useAuth();
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
  const canAccessManagerOnlyTools = hasExplicitRole("manager") || hasExplicitRole("hr_admin");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    data?.viewer.firstName ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const quickActions = [
    { label: "Request Leave", desc: "Submit a new request", icon: PlusCircle, path: "/request-leave" },
    { label: "My Leave", desc: "View balances", icon: CalendarDays, path: "/my-leave" },
    { label: "History", desc: "View past requests", icon: Clock, path: "/leave-history" },
    { label: "Attendance", desc: "View attendance log", icon: CheckSquare, path: "/attendance" },
    { label: "Holidays", desc: "View public holidays", icon: CalendarHeart, path: "/holidays" },
    ...(hasManagerAccess ? [{ label: "Approvals", desc: `${pendingCount} pending`, icon: CheckSquare, path: "/manager/approvals" }] : []),
    ...(hasManagerAccess ? [{ label: "Team Calendar", desc: "View team schedule", icon: CalendarDays, path: "/manager/team-calendar" }] : []),
    ...(canAccessManagerOnlyTools ? [{ label: "Team Attendance", desc: "Daily status", icon: Users, path: "/manager/team-attendance" }] : []),
    ...(hasRole("hr_admin") ? [{ label: "Employees", desc: "Manage staff", icon: Users, path: "/admin/employees" }] : []),
    { label: "Profile", desc: "Edit your details", icon: Users, path: "/profile" },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "cancelled":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const donutData = [
    { name: "Remaining", value: totalRemaining },
    { name: "Used", value: totalUsed },
  ];

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{fullDateFormatter.format(new Date())}</span>
        </div>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
          {greeting}, {firstName}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Your leave, attendance, and team pulse in one fluid control surface.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={revealItem}>
          <ClockInOutWidget />
        </motion.div>
        <motion.div variants={revealItem}>
          <Card className={cardShellClass}>
            <CardContent className="p-5">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Total Balance</p>
              <p className="text-3xl font-semibold tabular-nums text-foreground">{totalRemaining}</p>
              <p className="mt-1 text-xs text-muted-foreground">of {totalAllocation} days</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={revealItem}>
          <Card className={cardShellClass}>
            <CardContent className="p-5">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Days Used</p>
              <p className="text-3xl font-semibold tabular-nums text-foreground">{totalUsed}</p>
              <p className="mt-1 text-xs text-muted-foreground">this year</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={revealItem}>
          <Card className={cardShellClass}>
            <CardContent className="p-5">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Next Holiday</p>
              {upcomingHolidays.length > 0 ? (
                <>
                  <p className="text-lg font-semibold leading-tight text-foreground">{upcomingHolidays[0].name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{monthDayFormatter.format(parseISO(upcomingHolidays[0].date))}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">None upcoming</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={revealItem}>
          <Card className={cardShellClass}>
            <CardContent className="p-5">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Team Status</p>
              <p className="text-3xl font-semibold tabular-nums text-foreground">{teamAbsences.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">out this week</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div>
        <h2 className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Quick Actions</h2>
        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {quickActions.map((action) => (
            <motion.div
              key={action.path}
              variants={revealItem}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 340, damping: 22 }}
            >
              <Link
                to={action.path}
                aria-label={`${action.label}: ${action.desc}`}
                className="glass glass-panel group flex items-center gap-3.5 rounded-[1.5rem] border border-white/10 bg-white/10 p-4 text-left transition-[border-color,box-shadow,background-color] duration-300 ease-apple-ease hover:border-white/20 hover:bg-white/14 hover:shadow-xl dark:bg-white/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 transition-colors group-hover:bg-primary/8">
                  <action.icon className="h-4.5 w-4.5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            <Card className={`${cardShellClass} overflow-hidden`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-foreground">Leave Balance</CardTitle>
                  <Link to="/my-leave" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    View details <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {balances.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No leave balances found for this year.</p>
                ) : (
                  <>
                    <p className="sr-only">
                      Leave balance summary: {totalRemaining} days remaining out of {totalAllocation}, with {totalUsed} days used.
                    </p>
                    <div className="flex items-center gap-8">
                      <div className="relative h-32 w-32 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={38}
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
                              contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-semibold leading-none text-foreground">{totalRemaining}</span>
                          <span className="mt-0.5 text-[10px] text-muted-foreground">remaining</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          <span className="text-foreground">{totalRemaining} days remaining</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                          <span className="text-muted-foreground">{totalUsed} days used</span>
                        </div>
                        {totalAllocation > 0 ? (
                          <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" aria-hidden="true" />
                            <span>{Math.round((totalRemaining / totalAllocation) * 100)}% remaining</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {balances.map((balance) => {
                        const total = balance.leave_types?.annual_allocation || 0;
                        const percentage = total > 0 ? (balance.balance / total) * 100 : 0;

                        return (
                          <div key={balance.leave_type_id} className="space-y-2">
                            <div className="flex items-baseline justify-between">
                              <span className="text-sm text-foreground">{balance.leave_types?.name}</span>
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {balance.balance} / {total}
                              </span>
                            </div>
                            <Progress value={percentage} className="h-1.5" />
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.04 }}
          >
            <Card className={cardShellClass}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-foreground">Recent Requests</CardTitle>
                  <Link to="/leave-history" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentRequests.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No requests yet.</p>
                ) : (
                  <div className="space-y-1">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between border-b border-border/40 py-3 last:border-0">
                        <div>
                          <p className="text-sm text-foreground">{request.leave_types?.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {monthDayFormatter.format(parseISO(request.start_date))} - {monthDayYearFormatter.format(parseISO(request.end_date))}
                          </p>
                        </div>
                        <Badge variant={statusColor(request.status)} className="text-xs capitalize">
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

        <div className="space-y-6 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.08 }}
          >
            <Card className={cardShellClass}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-foreground">Upcoming Holidays</CardTitle>
                  <Link to="/holidays" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    All holidays <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingHolidays.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No upcoming holidays.</p>
                ) : (
                  <div className="space-y-1">
                    {upcomingHolidays.map((holiday) => {
                      const days = Math.ceil((parseISO(holiday.date).getTime() - startOfToday().getTime()) / (1000 * 60 * 60 * 24));
                      const label = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`;

                      return (
                        <div key={holiday.id} className="flex items-center justify-between border-b border-border/40 py-3 last:border-0">
                          <div>
                            <p className="text-sm text-foreground">{holiday.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{weekdayMonthDayFormatter.format(parseISO(holiday.date))}</p>
                          </div>
                          <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.12 }}
          >
            <Card className={cardShellClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-foreground">Team This Week</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {monthDayFormatter.format(startOfWeek(new Date(), { weekStartsOn: 1 }))} - {monthDayFormatter.format(endOfWeek(new Date(), { weekStartsOn: 1 }))}
                </p>
              </CardHeader>
              <CardContent>
                {teamAbsences.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/8">
                      <Users className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                    </div>
                    <p className="text-sm text-muted-foreground">Everyone is in this week</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {teamAbsences.map((absence) => (
                      <div key={absence.id} className="flex items-center gap-3 border-b border-border/40 py-3 last:border-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                            {getInitials(absence.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-foreground">
                            {absence.profiles?.full_name || absence.profiles?.email || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {absence.leave_types?.name} · {monthDayFormatter.format(parseISO(absence.start_date))}-{monthDayFormatter.format(parseISO(absence.end_date))}
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
