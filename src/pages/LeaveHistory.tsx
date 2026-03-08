import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
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
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("leave_requests")
      .select("id, start_date, end_date, reason, status, manager_comment, created_at, leave_types(name)")
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setRequests(data as unknown as LeaveRequest[]);
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Request cancelled");
      fetchRequests();
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "approved": return "default" as const;
      case "rejected": return "destructive" as const;
      case "cancelled": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leave History</h1>
        <p className="text-muted-foreground">View all your leave requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground">No leave requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.leave_types?.name}</TableCell>
                    <TableCell>{req.start_date}</TableCell>
                    <TableCell>{req.end_date}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.reason || "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant(req.status)}>{req.status}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.manager_comment || "—"}</TableCell>
                    <TableCell>
                      {req.status === "pending" && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleCancel(req.id)}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveHistory;
