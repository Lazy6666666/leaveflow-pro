import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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

const cardShellClass = "rounded-xl border bg-card text-card-foreground shadow-sm";

const MyLeave = () => {
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

  const statusVariant = (status: string) => {
    switch (status) {
      case "approved": return "default" as const;
      case "rejected": return "destructive" as const;
      case "cancelled": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  const exportCSV = () => {
    if (requests.length === 0) return;
    const csv = buildCSV(
      ["Type", "Start", "End", "Reason", "Status"],
      requests.map((r) => [r.leave_types?.name, r.start_date, r.end_date, r.reason, r.status])
    );
    downloadCSV(csv, `leave-history-${currentYear}.csv`);
  };

  if (isLoading) return (
    <div className="space-y-10">
      <PageHeaderSkeleton />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <BalanceCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={5} cols={6} />
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase mb-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Time Off</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Leave & Time Off
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your balances and requests for {currentYear}.</p>
        </div>
        <div className="flex items-center gap-3">
          {requests.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1 hidden sm:flex shrink-0 shadow-sm" onClick={exportCSV}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          )}
          <Button onClick={() => setIsRequestSheetOpen(true)} className="gap-2 shadow-sm shrink-0 sm:flex hidden">
            <PlusCircle className="h-4 w-4" /> Request Time Off
          </Button>
          <Button onClick={() => setIsRequestSheetOpen(true)} className="sm:hidden w-full shadow-sm">
             Request Time Off
          </Button>
        </div>
      </div>

      {/* Balances Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Balances</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {balances.map((b) => {
            const total = b.leave_types?.annual_allocation || 0;
            const used = total - b.balance;
            const pct = total > 0 ? (b.balance / total) * 100 : 0;
            return (
              <Card key={b.leave_type_id} className={cardShellClass}>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    {b.leave_types?.name}
                    <span className="text-2xl font-bold tabular-nums">
                      {b.balance}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>{used} days used</span>
                    <span>{b.balance} of {total} left</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {balances.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground border rounded-xl border-dashed">
              No leave balances allocated yet. Contact HR.
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">History</h2>
        </div>
        
        <Card className={cardShellClass}>
          <CardContent className="p-0">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileX className="h-8 w-8 mb-4 opacity-40 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No leave history</p>
                <p className="text-xs mt-1">Your past and upcoming requests will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="font-semibold px-4 md:px-6">Type</TableHead>
                      <TableHead className="font-semibold">Duration</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Reason</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">Note from HR/Manager</TableHead>
                      <TableHead className="w-20 font-semibold px-4 md:px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((req) => (
                      <TableRow key={req.id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium px-4 md:px-6 py-4">{req.leave_types?.name}</TableCell>
                        <TableCell className="tabular-nums whitespace-nowrap py-4">
                          {format(parseISO(req.start_date), "MMM d")} 
                          {req.start_date !== req.end_date && ` — ${format(parseISO(req.end_date), "MMM d")}`}
                          <span className="text-muted-foreground text-xs ml-1.5">
                            {format(parseISO(req.end_date), "yyyy")}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground hidden md:table-cell py-4">{req.reason || "—"}</TableCell>
                        <TableCell className="py-4">
                          <Badge variant={statusVariant(req.status)} className="capitalize shadow-none font-medium text-xs rounded-md">
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground hidden lg:table-cell py-4">{req.manager_comment || "—"}</TableCell>
                        <TableCell className="px-4 md:px-6 py-4">
                          {req.status === "pending" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs">
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this {req.leave_types?.name} request ({format(parseISO(req.start_date), "MMM d")} — {format(parseISO(req.end_date), "MMM d")})? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">Keep Request</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => cancelMutation.mutate(req.id)}
                                    disabled={cancelMutation.isPending}
                                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {cancelMutation.isPending ? "Cancelling..." : "Cancel Request"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="border-t px-4 py-3">
                  <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RequestLeaveSheet open={isRequestSheetOpen} onOpenChange={setIsRequestSheetOpen} />
    </div>
  );
};

export default MyLeave;
