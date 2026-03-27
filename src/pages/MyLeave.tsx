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
    <div className="space-y-10 max-w-7xl mx-auto">
      <PageHeaderSkeleton />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <BalanceCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={5} cols={6} />
    </div>
  );

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      className="mx-auto max-w-7xl space-y-12 pb-12"
    >
      {/* 1. Header Area with noise/glassmorphism */}
      <motion.div variants={staggerReveal} className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between pb-6 border-[color:var(--balance-ghost-border)] border-b">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--balance-surface-top)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--balance-primary)] shadow-[var(--balance-shadow-soft)] ring-1 ring-black/[0.03]">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>Time Off</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-[color:var(--balance-ink)] font-display mt-4">
            Leave <span className="text-[color:var(--balance-muted)]">&</span> Balances
          </h1>
          <p className="max-w-[40ch] text-lg text-[color:var(--balance-muted)]">
            Manage your time away. Completely transparent, always up to date.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {requests.length > 0 && (
            <Button 
              variant="outline" 
              className="rounded-full shadow-sm ring-1 ring-black/[0.05] border-0 hover:bg-[var(--balance-surface-top)] transition-all h-12 px-6" 
              onClick={exportCSV}
            >
              <Download className="h-4 w-4 mr-2" /> 
              <span className="font-semibold">Export CSV</span>
            </Button>
          )}
          <Button 
            onClick={() => setIsRequestSheetOpen(true)} 
            className="rounded-full shadow-[0_10px_20px_-10px_var(--balance-primary)] bg-[color:var(--balance-primary)] hover:bg-[color:var(--balance-primary-deep)] text-white h-12 px-8 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="h-5 w-5 mr-2" /> 
            <span className="font-bold text-sm">Request Time Off</span>
          </Button>
        </div>
      </motion.div>

      {/* 2. Bento Balances */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-[color:var(--balance-ink)]">Current Balances</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {balances.map((b, i) => {
            const total = b.leave_types?.annual_allocation || 0;
            const used = total - b.balance;
            const pct = total > 0 ? (b.balance / total) * 100 : 0;
            
            return (
              <motion.div 
                variants={staggerReveal}
                whileHover={{ y: -4, shadow: "0 24px 48px -12px rgba(0,0,0,0.08)" }}
                key={b.leave_type_id} 
                className="relative overflow-hidden rounded-[2rem] bg-[var(--balance-surface-top)] p-8 shadow-[0_15px_30px_-15px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.03] dark:ring-white/[0.03] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold text-[color:var(--balance-ink)] truncate pr-4">
                    {b.leave_types?.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tighter text-[color:var(--balance-primary)] tabular-nums leading-none">
                      {b.balance}
                    </span>
                    <span className="text-sm font-semibold text-[color:var(--balance-muted)]">left</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className="h-full bg-[color:var(--balance-primary)] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold text-[color:var(--balance-muted)] px-1">
                    <span>{used} used</span>
                    <span>{total} total</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {balances.length === 0 && (
            <motion.div variants={staggerReveal} className="col-span-full py-12 text-center text-[color:var(--balance-muted)] rounded-[2rem] bg-[var(--balance-surface-top)] ring-1 ring-black/[0.03] ring-dashed">
              <p className="text-lg font-semibold">No balances allocated</p>
              <p className="text-sm mt-1">Contact your administrator if you believe this is an error.</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* 3. Ghost-style History List */}
      <motion.div variants={staggerReveal} className="space-y-6 pt-6">
        <h2 className="text-2xl font-bold tracking-tight text-[color:var(--balance-ink)]">Request History</h2>
        
        <div className="rounded-[2rem] bg-[var(--balance-surface-top)] shadow-[0_15px_30px_-15px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.03] dark:ring-white/[0.03] overflow-hidden">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileX className="h-10 w-10 mb-4 text-[color:var(--balance-muted)] opacity-50" />
              <p className="text-lg font-bold text-[color:var(--balance-ink)]">No history found</p>
              <p className="text-sm text-[color:var(--balance-muted)] max-w-[250px] mt-2">Past and upcoming leave requests will be elegantly organized here.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[color:var(--balance-ghost-border)]">
              {/* Ghost Header - Only shown on larger screens */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 text-xs font-bold uppercase tracking-widest text-[color:var(--balance-muted)] bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="col-span-3">Type & Dates</div>
                <div className="col-span-4">Details</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3 text-right">Action</div>
              </div>

              {/* Rows */}
              <AnimatePresence>
                {paginatedItems.map((req, i) => (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.05 }}
                    key={req.id} 
                    className="group flex flex-col md:grid md:grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-[color:var(--balance-surface)] transition-colors duration-300"
                  >
                    
                    {/* 1. Type & Dates */}
                    <div className="col-span-3 w-full md:w-auto">
                      <p className="font-bold text-base text-[color:var(--balance-ink)] mb-1">{req.leave_types?.name}</p>
                      <p className="text-sm font-medium text-[color:var(--balance-muted)] tabular-nums">
                        {format(parseISO(req.start_date), "MMM d")} 
                        {req.start_date !== req.end_date && ` — ${format(parseISO(req.end_date), "MMM d")}`}
                        <span className="opacity-60 ml-2">{format(parseISO(req.end_date), "yyyy")}</span>
                      </p>
                    </div>

                    {/* 2. Details (Reason & Comments) */}
                    <div className="col-span-4 w-full md:w-auto space-y-1">
                      {req.reason ? (
                        <p className="text-sm text-[color:var(--balance-ink)] line-clamp-1 opacity-90">{req.reason}</p>
                      ) : (
                        <p className="text-sm text-[color:var(--balance-muted)] italic">No comments provided</p>
                      )}
                      
                      {req.manager_comment && (
                        <p className="text-xs font-medium text-[color:var(--balance-primary)] bg-[color:var(--balance-primary-soft)] inline-block px-2 py-0.5 rounded-md mt-1">
                          HR: {req.manager_comment}
                        </p>
                      )}
                    </div>

                    {/* 3. Status */}
                    <div className="col-span-2 w-full md:w-auto">
                      <StatusPill status={req.status} />
                    </div>

                    {/* 4. Action */}
                    <div className="col-span-3 w-full md:w-auto md:text-right flex md:justify-end">
                      {req.status === "pending" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full font-bold px-4"
                            >
                              Withdraw
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem] p-8 border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]">
                            <AlertDialogHeader className="mb-4">
                              <AlertDialogTitle className="text-2xl font-bold font-display">Recall Request</AlertDialogTitle>
                              <AlertDialogDescription className="text-base">
                                Are you sure you want to withdraw this {req.leave_types?.name} request for {format(parseISO(req.start_date), "MMM do")}? This action is instantaneous.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3">
                              <AlertDialogCancel className="rounded-full rounded-tr-full font-semibold border-0 ring-1 ring-black/5 hover:bg-slate-50 px-6">
                                Keep It
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancelMutation.mutate(req.id)}
                                disabled={cancelMutation.isPending}
                                className="rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 border-0 shadow-lg shadow-rose-500/20"
                              >
                                {cancelMutation.isPending ? "Processing..." : "Confirm Withdrawal"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {requests.length > 0 && (
            <div className="bg-slate-50/50 dark:bg-white/[0.01] px-8 py-5 border-t border-[color:var(--balance-ghost-border)]">
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} />
            </div>
          )}
        </div>
      </motion.div>

      <RequestLeaveSheet open={isRequestSheetOpen} onOpenChange={setIsRequestSheetOpen} />
    </motion.div>
  );
}

function StatusPill({ status }: { status: string }) {
  let style = "bg-[color:var(--balance-ghost-border)] text-[color:var(--balance-muted)]";
  
  if (status === "approved") {
    style = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 ring-1 ring-emerald-500/20";
  }
  if (status === "rejected") {
    style = "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 ring-1 ring-rose-500/20";
  }
  if (status === "pending") {
    style = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 ring-1 ring-amber-500/30";
  }
  
  return (
    <span className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full ${style}`}>
      {status}
    </span>
  );
}
