import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

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

  useEffect(() => {
    fetchRequests();
  }, []);

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
      setSelectedRequest(null);
      setComment("");
      setAction(null);
      fetchRequests();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
        <p className="text-muted-foreground">Review and action team leave requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Pending Requests <Badge variant="outline" className="ml-2">{requests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground">No pending requests.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.profiles?.full_name || req.profiles?.email}</TableCell>
                    <TableCell>{req.leave_types?.name}</TableCell>
                    <TableCell>{req.start_date}</TableCell>
                    <TableCell>{req.end_date}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.reason || "—"}</TableCell>
                    <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" onClick={() => { setSelectedRequest(req); setAction("approved"); }}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setSelectedRequest(req); setAction("rejected"); }}>
                        Reject
                      </Button>
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
            <div>
              <p className="text-sm text-muted-foreground">Employee: {selectedRequest?.profiles?.full_name}</p>
              <p className="text-sm text-muted-foreground">Type: {selectedRequest?.leave_types?.name}</p>
              <p className="text-sm text-muted-foreground">Dates: {selectedRequest?.start_date} — {selectedRequest?.end_date}</p>
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
