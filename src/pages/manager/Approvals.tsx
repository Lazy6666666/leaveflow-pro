import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckSquare, Inbox } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getErrorMessage } from "@/lib/errors";
import type { LeaveRequestId } from "@/lib/convexTypes";

interface PendingRequest {
  id: LeaveRequestId;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
  leave_types: { name: string } | null;
}

const Approvals = () => {
  const queryClient = useQueryClient();
  const { sessionId, roleScope, surface, trackOnce } = useAnalytics();
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [comment, setComment] = useState("");
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => (await convex.query(api.leave.getPendingApprovals, {})) as PendingRequest[],
    staleTime: 60 * 1000,
  });

  const { page, totalPages, paginatedItems, setPage, totalItems } = usePagination(requests, 10);

  useEffect(() => {
    if (!isLoading) {
      void trackOnce("approvals_page_viewed", "approvals_page_viewed", {
        pending_count: requests.length,
      }, { surface: "manager", path: "/manager/approvals" });
    }
  }, [isLoading, requests.length, trackOnce]);

  const actionMutation = useMutation({
    mutationFn: async ({ id, status, comment }: { id: LeaveRequestId; status: "approved" | "rejected"; comment: string | null }) => {
      const target = requests.find((request) => request.id === id);
      const createdAt = target ? parseISO(target.created_at).getTime() : NaN;
      const decisionLatencyHours = Number.isNaN(createdAt) ? undefined : Math.max(0, Math.round(((Date.now() - createdAt) / 36e5) * 10) / 10);
      await convex.mutation(api.leave.updateRequestStatus, {
        requestId: id,
        status,
        managerComment: comment || undefined,
        analytics: {
          sessionId,
          roleScope,
          surface,
          path: "/manager/approvals",
          decisionLatencyHours,
        },
      });
      return { id, status };
    },
    onSuccess: ({ id, status }) => {
      toast.success(`Request ${status}`);
      setSelectedRequest(null);
      setComment("");
      setAction(null);
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-balances"] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to update request")),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={4} cols={5} />
    </div>
  );

  const handleAction = () => {
    if (!selectedRequest || !action) return;
    actionMutation.mutate({ id: selectedRequest.id, status: action, comment: comment || null });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Manager</p>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-foreground" /> Pending Approvals
        </h1>
        <p className="text-sm text-muted-foreground">Review and action team leave requests.</p>
      </div>

      <Card className="rounded-[32px] shadow-float border-none bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Pending Requests
            <Badge variant="secondary" className="text-xs">{requests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Inbox className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No pending requests. All caught up!</p>
            </div>
          ) : (
            <>
              <Table className="border-none">
                <TableHeader className="[&_tr]:border-none">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="hidden md:table-cell">Reason</TableHead>
                    <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                    <TableHead className="w-48">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((req, idx) => (
                    <TableRow key={req.id} className={cn("border-none transition-colors", idx % 2 === 0 ? "bg-background/50" : "bg-transparent")}>
                      <TableCell className="font-medium">{req.profiles?.full_name || req.profiles?.email}</TableCell>
                      <TableCell>{req.leave_types?.name}</TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {format(parseISO(req.start_date), "MMM d")} — {format(parseISO(req.end_date), "MMM d")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground hidden md:table-cell">{req.reason || "—"}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">{format(parseISO(req.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex min-w-[140px] flex-col gap-2 sm:min-w-0 sm:flex-row">
                          <Button size="sm" className="h-8 terracotta-gradient border-none" onClick={() => { setSelectedRequest(req); setAction("approved"); }}>Approve</Button>
                          <Button size="sm" variant="destructive" className="h-8" onClick={() => { setSelectedRequest(req); setAction("rejected"); }}>Reject</Button>
                        </div>
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

      <Dialog open={!!selectedRequest} onOpenChange={() => { setSelectedRequest(null); setComment(""); setAction(null); }}>
        <DialogContent className="rounded-[32px] border-none shadow-float">
          <DialogHeader>
            <DialogTitle>{action === "approved" ? "Approve" : "Reject"} Leave Request</DialogTitle>
            <DialogDescription>
              Review the request details and optionally leave a comment before confirming your decision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{selectedRequest?.profiles?.full_name}</span></p>
              <p><span className="text-muted-foreground">Type:</span> <span className="font-medium">{selectedRequest?.leave_types?.name}</span></p>
              <p><span className="text-muted-foreground">Dates:</span> <span className="font-medium">{selectedRequest?.start_date} — {selectedRequest?.end_date}</span></p>
            </div>
            <Textarea placeholder="Add a comment (optional)..." value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="rounded-xl border-border/15" />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setSelectedRequest(null); setComment(""); setAction(null); }}>Cancel</Button>
            <Button variant={action === "rejected" ? "destructive" : "default"} className={cn("rounded-xl", action === "approved" && "terracotta-gradient border-none")} onClick={handleAction} disabled={actionMutation.isPending}>
              {actionMutation.isPending ? "Processing..." : action === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approvals;
