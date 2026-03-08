import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { History, FileX } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

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
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("leave_requests")
      .select("id, start_date, end_date, reason, status, manager_comment, created_at, leave_types(name)")
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setRequests(data as unknown as LeaveRequest[]);
  };

  useEffect(() => { fetchRequests(); }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("leave_requests").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Request cancelled"); fetchRequests(); }
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
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" /> Leave History
        </h1>
        <p className="text-muted-foreground mt-1">View all your leave requests</p>
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
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.leave_types?.name}</TableCell>
                    <TableCell className="tabular-nums">{format(parseISO(req.start_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="tabular-nums">{format(parseISO(req.end_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground hidden md:table-cell">{req.reason || "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant(req.status)} className="capitalize">{req.status}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground hidden lg:table-cell">{req.manager_comment || "—"}</TableCell>
                    <TableCell>
                      {req.status === "pending" && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-8 text-xs" onClick={() => handleCancel(req.id)}>
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
