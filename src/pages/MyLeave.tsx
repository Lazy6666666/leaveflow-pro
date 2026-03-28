import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { FileX, Download, CalendarDays, PlusCircle, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeaderSkeleton, TableSkeleton, BalanceCardSkeleton } from "@/components/skeletons";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import { buildCSV, downloadCSV } from "@/lib/csv";
import { getErrorMessage } from "@/lib/errors";
import type { LeaveRequestId } from "@/lib/convexTypes";
import { useAnalytics } from "@/hooks/useAnalytics";
import { RequestLeaveSheet } from "@/components/leave/RequestLeaveSheet";

interface LeaveBalance {
  balance: number;
  leave_type_id: string;
  year: number;
  leave_types: { name: string; annual_allocation: number; carry_forward_limit: number } | null;
}

interface LeaveRequest {
  id: LeaveRequestId;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  manager_comment: string | null;
  created_at: string;
  leave_types: { name: string } | null;
}

// Motion configs
const premiumSpring = { type: "spring", stiffness: 100, damping: 20 };
const staggerReveal = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: premiumSpring }
};

export default function MyLeave() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const { trackOnce } = useAnalytics();
  const [isRequestSheetOpen, setIsRequestSheetOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: balances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ["leave-balances", user?.id, currentYear],
    queryFn: async () => (await convex.query(api.leave.getMyBalances, { year: currentYear })) as LeaveBalance[],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: requests = [], isLoading: historyLoading } = useQuery({
    queryKey: ["leave-history", user?.id],
    queryFn: async () => (await convex.query(api.leave.getLeaveHistory, {})) as LeaveRequest[],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = balancesLoading || historyLoading;

  useEffect(() => {
    if (!isLoading) {
      void trackOnce(`my_leave_unified_viewed:${currentYear}`, "my_leave_unified_viewed", {
        balance_count: balances.length,
        request_count: requests.length,
        current_year: currentYear,
      }, { surface: "leave", path: "/my-leave" });
    }
  }, [balances.length, requests.length, currentYear, isLoading, trackOnce]);

  const { page, totalPages, paginatedItems, setPage, totalItems } = usePagination(requests, 10);

  const cancelMutation = useMutation({
    mutationFn: async (id: LeaveRequestId) => {
      await convex.mutation(api.leave.cancelRequest, { requestId: id });
    },
    onSuccess: () => {
      toast.success("Request cancelled");
      queryClient.invalidateQueries({ queryKey: ["leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-balances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-recent"] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to cancel request")),
  });

  const exportCSV = () => {
    if (requests.length === 0) return;
    const csv = buildCSV(
      ["Type", "Start", "End", "Reason", "Status"],
      requests.map((r) => [r.leave_types?.name, r.start_date, r.end_date, r.reason, r.status])
    );
    downloadCSV(csv, `leave-history-${currentYear}.csv`);
  };

  if (isLoading) return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-8">
      <PageHeaderSkeleton />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white p-8 rounded-xl shadow-float">
            <BalanceCardSkeleton />
          </div>
        ))}
      </div>
      <TableSkeleton rows={5} cols={6} />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-7xl space-y-12 pb-24 px-4 md:px-8"
    >
      {/* 1. Header Area - Editorial & Approachable */}
      <header className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-primary">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Time Off & Attendance</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tight text-foreground leading-[1.1]">
            My Leave <br />
            <span className="text-primary/40 italic font-light">Overview.</span>
          </h1>
          <p className="max-w-[45ch] text-lg text-muted-foreground font-sans leading-relaxed">
            Your personalized concierge for time-off management and historical request records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {requests.length > 0 && (
            <Button
              variant="secondary"
              className="rounded-xl h-12 px-6 bg-muted hover:bg-muted/80 text-foreground transition-all shadow-sm"
              onClick={exportCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              <span>Export Ledger</span>
            </Button>
          )}
          <Button
            onClick={() => setIsRequestSheetOpen(true)}
            className="rounded-xl terracotta-gradient text-white h-12 px-8 font-bold hover:opacity-90 transition-all shadow-float"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>Request Leave</span>
          </Button>
        </div>
      </header>

      {/* 2. Bento Balances - Layered Surface Layout */}
      <section className="space-y-8">
        <div className="flex items-baseline gap-4">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary/60">Active Allocations</h2>
          <div className="h-[2px] flex-1 bg-muted/40 rounded-full" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {balances.map((b, i) => {
            const total = b.leave_types?.annual_allocation || 0;
            const used = total - b.balance;
            const pct = total > 0 ? (b.balance / total) * 100 : 0;

            return (
              <motion.div
                key={b.leave_type_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ...premiumSpring }}
                className="group relative bg-white p-8 rounded-xl shadow-float hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col h-full justify-between gap-10">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-widest font-sans">
                      {b.leave_types?.name}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-display font-black tracking-tighter text-foreground tabular-nums">
                        {b.balance}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Days Left</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full terracotta-gradient rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 + 0.3 }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-sans">
                      <span>{used} Days Used</span>
                      <span>{total} Total Allocation</span>
                    </div>
                  </div>
                </div>
                {/* Visual anchor */}
                <div className="absolute top-6 right-6 p-2 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </motion.div>
            );
          })}

          {balances.length === 0 && (
            <div className="col-span-full py-24 text-center bg-muted/20 rounded-xl">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No active balances</p>
              <p className="text-xs mt-2 text-muted-foreground/60">System indicates no active leave policies assigned to your profile.</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. History Ledger - Editorial Table Layout */}
      <section className="space-y-8 pt-8">
        <div className="flex items-baseline gap-4">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary/60">Request Archive</h2>
          <div className="h-[2px] flex-1 bg-muted/40 rounded-full" />
        </div>

        <div className="bg-white rounded-xl shadow-float overflow-hidden">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center mb-6">
                <FileX className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No historical records</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-primary/60">Classification</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-primary/60">Timeline</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-primary/60">Annotations</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-primary/60">Status</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-primary/60 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30">
                  <AnimatePresence>
                    {paginatedItems.map((req, i) => (
                      <motion.tr
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <span className="font-bold text-foreground text-base">{req.leave_types?.name}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-foreground font-semibold text-sm">
                              {format(parseISO(req.start_date), "MMM d, yyyy")}
                            </span>
                            {req.start_date !== req.end_date && (
                              <span className="text-muted-foreground text-xs">
                                to {format(parseISO(req.end_date), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
                            {req.reason ? `"${req.reason}"` : "No description provided"}
                          </p>
                          {req.manager_comment && (
                            <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded-full inline-block">
                              Note: {req.manager_comment}
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <StatusBadge status={req.status as any} />
                        </td>
                        <td className="px-8 py-6 text-right">
                          {req.status === "pending" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-9 px-4 text-destructive hover:bg-destructive/10 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"
                                >
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-xl border-none shadow-float p-8">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-2xl font-display font-black text-foreground">Withdraw Request?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-base text-muted-foreground leading-relaxed mt-2">
                                    Are you sure you want to cancel this {req.leave_types?.name} request? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-8 gap-3">
                                  <AlertDialogCancel className="rounded-xl bg-muted border-none font-bold uppercase text-[11px] tracking-widest h-12">
                                    Keep Request
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => cancelMutation.mutate(req.id)}
                                    disabled={cancelMutation.isPending}
                                    className="rounded-xl bg-destructive text-white font-bold uppercase text-[11px] tracking-widest h-12 shadow-md hover:bg-destructive/90"
                                  >
                                    Yes, Cancel
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {requests.length > 0 && (
            <div className="px-8 py-6 bg-muted/20">
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} />
            </div>
          )}
        </div>
      </section>

      <RequestLeaveSheet open={isRequestSheetOpen} onOpenChange={setIsRequestSheetOpen} />
    </motion.div>
  );
}

function StatusBadge({ status }: { status: "approved" | "pending" | "rejected" | "cancelled" }) {
  const styles = {
    approved: "bg-emerald-500/10 text-emerald-600",
    pending: "bg-amber-500/10 text-amber-600",
    rejected: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${styles[status] || styles.cancelled}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'pending' ? 'animate-pulse bg-current' : 'bg-current'}`} />
      {status}
    </span>
  );
}
