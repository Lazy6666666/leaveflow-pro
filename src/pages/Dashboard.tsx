import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { parseISO, startOfToday } from "date-fns";
import {
  ArrowRight,
  Calendar,
  Clock,
  Briefcase,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";

import { ClockInOutWidget } from "@/components/attendance/ClockInOutWidget";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardSkeleton } from "@/components/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { cn } from "@/lib/utils";

const STALE_TIME = 5 * 60 * 1000;
const dashboardDateFormatters = {
  currentDate: new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
  requestStart: new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }),
  requestEnd: new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }),
  holiday: new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }),
  absence: new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }),
};

// "The Digital Concierge" Styles
const sectionClass = "space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-concierge";
const conciergeCardClass = "relative bg-card p-10 shadow-float rounded-xl border-0 transition-all duration-500 hover:scale-[1.01]";
const labelClass = "text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4 block";
const displayTitleClass = "font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl mb-4";
const formatRequestRange = (startDate: string, endDate: string) =>
  `${dashboardDateFormatters.requestStart.format(parseISO(startDate))} — ${dashboardDateFormatters.requestEnd.format(parseISO(endDate))}`;
const formatHolidayDate = (date: string) =>
  dashboardDateFormatters.holiday.format(parseISO(date));
const formatAbsenceRange = (startDate: string, endDate: string) =>
  `${dashboardDateFormatters.absence.format(parseISO(startDate))} — ${dashboardDateFormatters.absence.format(parseISO(endDate))}`;

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
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const firstName =
    data?.viewer.firstName ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Friend";

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  };

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
    <div className={sectionClass}>
      {/* 01. Welcome Header: Editorial & Warm */}
      <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-1 w-12 terracotta-gradient rounded-full" />
             <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
               Digital Concierge Active
             </span>
          </div>
          <h1 className={displayTitleClass}>
            {greeting}, <br className="hidden sm:block" />
            <span className="text-primary italic font-medium">{firstName}.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-sans">
             Your workforce environment is synchronized. Everything is in its place, just as you left it.
          </p>
        </div>
        <div className="bg-muted px-8 py-4 rounded-xl shadow-sm text-center">
           <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Date</span>
           <span className="font-display text-xl font-bold text-foreground">
             {dashboardDateFormatters.currentDate.format(new Date())}
           </span>
        </div>
      </header>

      {/* 02. Layers of Insight: Using Surface Hierarchy instead of lines */}
      <div className="grid gap-12 lg:grid-cols-12">
        {/* Main Column */}
        <div className="space-y-12 lg:col-span-8">
          {/* Clocking Widget Section: Depth over borders */}
          <div className="rounded-xl overflow-hidden shadow-float">
             <ClockInOutWidget />
          </div>

          {/* Leave Inventory: Layers and asymmetry */}
          <div className={conciergeCardClass}>
             <span className={labelClass}>Allocated Resources</span>
             <h2 className="font-display text-3xl font-bold mb-10">Leave Inventory</h2>

             <div className="flex flex-col gap-12 md:flex-row md:items-center">
                <div className="relative h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Remaining", value: totalRemaining },
                          { name: "Used", value: totalUsed },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        dataKey="value"
                        strokeWidth={0}
                        paddingAngle={4}
                      >
                        <Cell fill="var(--primary)" />
                        <Cell fill="var(--muted)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-5xl font-bold text-primary tabular-nums tracking-tighter">{totalRemaining}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Days Left</span>
                  </div>
                </div>

                <div className="flex-1 space-y-8">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="bg-muted/50 p-6 rounded-xl">
                         <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Capacity</span>
                         <span className="text-3xl font-bold font-mono text-foreground">{totalAllocation}d</span>
                      </div>
                      <div className="bg-muted/50 p-6 rounded-xl">
                         <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Logged Utilization</span>
                         <span className="text-3xl font-bold font-mono text-foreground">{totalUsed}d</span>
                      </div>
                   </div>

                   <div className="space-y-5 pt-4">
                      {balances.slice(0, 2).map((b) => (
                        <div key={b.leave_type_id} className="space-y-2">
                           <div className="flex justify-between items-end">
                              <span className="text-sm font-semibold text-foreground">{b.leave_types?.name}</span>
                              <span className="font-mono text-xs font-bold text-primary">{b.balance} / {b.leave_types?.annual_allocation}d</span>
                           </div>
                           <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(b.balance / (b.leave_types?.annual_allocation || 1)) * 100}%` }}
                                className="h-full terracotta-gradient rounded-full"
                              />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="mt-12 flex justify-end">
                <Link to="/my-leave" className="group flex items-center gap-3 text-sm font-bold text-primary uppercase tracking-widest">
                   Manage Inventory <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                </Link>
             </div>
          </div>

          {/* History Ledger: Alternate background shifts instead of dividers */}
          <div className={conciergeCardClass}>
             <span className={labelClass}>Activity History</span>
             <h2 className="font-display text-3xl font-bold mb-8 text-foreground">Recent Log Telemetry</h2>

             <div className="space-y-4">
                {recentRequests.length === 0 ? (
                  <div className="py-16 text-center bg-muted/30 rounded-xl">
                     <p className="text-sm italic text-muted-foreground">No recent activity recorded.</p>
                  </div>
                ) : (
                  recentRequests.slice(0, 4).map((req, i) => (
                    <div key={req.id} className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-xl transition-all hover:bg-muted/30",
                      i % 2 === 0 ? "bg-muted/40" : "bg-transparent"
                    )}>
                      <div className="flex items-center gap-5">
                         <div className="h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-primary">
                            <Calendar className="h-5 w-5" />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-foreground">{req.leave_types?.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {formatRequestRange(req.start_date, req.end_date)}
                            </p>
                         </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center gap-4">
                         <div className={cn(
                            "status-badge",
                            req.status === 'approved' ? 'status-approved' :
                            req.status === 'rejected' ? 'status-rejected' :
                            'status-pending'
                         )}>
                            {req.status}
                         </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Side Column: Layers of auxiliary info */}
        <div className="space-y-12 lg:col-span-4">
           {/* Upcoming Holidays: Glassmorphism moments */}
           <div className={cn(conciergeCardClass, "bg-muted/50")}>
              <span className={labelClass}>System Observations</span>
              <h2 className="font-display text-2xl font-bold mb-8">Service Interruptions</h2>

              <div className="space-y-6">
                 {upcomingHolidays.slice(0, 4).map(holiday => (
                   <div key={holiday.id} className="group relative bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-foreground">{holiday.name}</span>
                        <div className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          T-{Math.ceil((parseISO(holiday.date).getTime() - startOfToday().getTime()) / (1000 * 60 * 60 * 24))}d
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase">
                         <Clock className="h-3 w-3" />
                         {formatHolidayDate(holiday.date)}
                      </div>
                   </div>
                 ))}
                 {upcomingHolidays.length === 0 && <p className="text-sm italic text-muted-foreground">No interruptions detected.</p>}
              </div>
           </div>

           {/* Team Absence: Bio-metrics and Presence */}
           <div className={conciergeCardClass}>
              <span className={labelClass}>Workforce Proximity</span>
              <h2 className="font-display text-2xl font-bold mb-8">External Units</h2>

              <div className="space-y-6">
                 {teamAbsences.slice(0, 5).map(absence => (
                   <div key={absence.id} className="flex items-center gap-5 p-2 rounded-xl hover:bg-muted/30 transition-all">
                      <div className="relative">
                        <Avatar className="h-12 w-12 rounded-xl shadow-sm border-0">
                          <AvatarFallback className="bg-muted text-xs font-bold text-primary">
                            {getInitials(absence.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-4 border-white rounded-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground uppercase tracking-tight">
                          {absence.profiles?.full_name || "Guest Unit"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono leading-none mt-1">
                          OFF-SITE • {formatAbsenceRange(absence.start_date, absence.end_date)}
                        </p>
                      </div>
                   </div>
                 ))}
                 {teamAbsences.length === 0 && (
                   <div className="text-center py-8">
                      <ShieldCheck className="h-8 w-8 text-emerald-500/30 mx-auto mb-4" />
                      <p className="text-sm font-medium text-muted-foreground">Full Workforce Integrity</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
