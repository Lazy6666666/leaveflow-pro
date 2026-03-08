import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckSquare, Inbox } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

interface PendingRequest {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
  leave_types: { name: string } | null;
}

const Approvals = () => {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [comment, setComment] = useState("");
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("leave_requests")
      .select("id, start_date, end_date, reason, status, created_at, profiles:employee_id(full_name, email), leave_types(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (data) setRequests(data as unknown as PendingRequest[]);
  };

  useEffect(() => { fetchRequests().finally(() => setPageLoading(false)); }, []);

  if (pageLoading) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={4} cols={5} />
    </div>
  );

  const handleAction = async () => {
    if (!selectedRequest || !action) return;
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: action, manager_comment: comment || null })
      .eq("id", selectedRequest.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Request ${action}`);
      supabase.functions.invoke("notify-leave", { body: { type: action, request_id: selectedRequest.id } }).catch(() => {});
      setSelectedRequest(null); setComment(""); setAction(null); fetchRequests();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" /> Pending Approvals
        </h1>
        <p className="text-muted-foreground mt-1">Review and action team leave requests</p>
      </div>

      <Card>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.profiles?.full_name || req.profiles?.email}</TableCell>
                    <TableCell>{req.leave_types?.name}</TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {format(parseISO(req.start_date), "MMM d")} — {format(parseISO(req.end_date), "MMM d")}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground hidden md:table-cell">{req.reason || "—"}</TableCell>
                    <TableCell className="text-muted-foreground hidden lg:table-cell">{format(parseISO(req.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" className="h-8" onClick={() => { setSelectedRequest(req); setAction("approved"); }}>Approve</Button>
                      <Button size="sm" variant="destructive" className="h-8" onClick={() => { setSelectedRequest(req); setAction("rejected"); }}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={() => { setSelectedRequest(null); setComment(""); setAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "approved" ? "Approve" : "Reject"} Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{selectedRequest?.profiles?.full_name}</span></p>
              <p><span className="text-muted-foreground">Type:</span> <span className="font-medium">{selectedRequest?.leave_types?.name}</span></p>
              <p><span className="text-muted-foreground">Dates:</span> <span className="font-medium">{selectedRequest?.start_date} — {selectedRequest?.end_date}</span></p>
            </div>
            <Textarea placeholder="Add a comment (optional)..." value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedRequest(null); setComment(""); setAction(null); }}>Cancel</Button>
            <Button variant={action === "rejected" ? "destructive" : "default"} onClick={handleAction}>
              {action === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approvals;
