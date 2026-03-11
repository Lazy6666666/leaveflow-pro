import { useAuth } from "@/contexts/AuthContext";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { History, FileX, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import { buildCSV, downloadCSV } from "@/lib/csv";
import { getErrorMessage } from "@/lib/errors";
import type { LeaveRequestId } from "@/lib/convexTypes";

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

const LeaveHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["leave-history", user?.id],
    queryFn: async () => (await convex.query(api.leave.getLeaveHistory, {})) as LeaveRequest[],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

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

  if (isLoading) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={5} cols={6} />
    </div>
  );

  const statusVariant = (status: string) => {
    switch (status) {
      case "approved": return "default" as const;
      case "rejected": return "destructive" as const;
      case "cancelled": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  const exportCSV = () => {
    const csv = buildCSV(
      ["Type", "Start", "End", "Reason", "Status"],
      requests.map((r) => [r.leave_types?.name, r.start_date, r.end_date, r.reason, r.status])
    );
    downloadCSV(csv, "leave-history.csv");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Leave</p>
          <h1 className="flex items-center gap-2 text-3xl font-serif font-semibold tracking-tight text-foreground">
            <History className="h-6 w-6 text-foreground" /> Leave History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">View all your leave requests.</p>
        </div>
        {requests.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            All Requests
            <Badge variant="secondary" className="text-xs">{requests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileX className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No leave requests found.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="hidden md:table-cell">Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Comment</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.leave_types?.name}</TableCell>
                      <TableCell className="tabular-nums">{format(parseISO(req.start_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="tabular-nums">{format(parseISO(req.end_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground hidden md:table-cell">{req.reason || "—"}</TableCell>
                      <TableCell><Badge variant={statusVariant(req.status)} className="capitalize">{req.status}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground hidden lg:table-cell">{req.manager_comment || "—"}</TableCell>
                      <TableCell>
                        {req.status === "pending" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-8 text-xs">
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this {req.leave_types?.name} request ({format(parseISO(req.start_date), "MMM d")} — {format(parseISO(req.end_date), "MMM d")})? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelMutation.mutate(req.id)}
                                  disabled={cancelMutation.isPending}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveHistory;
