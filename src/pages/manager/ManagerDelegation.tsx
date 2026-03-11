import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserCheck, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getErrorMessage } from "@/lib/errors";
import type { ManagerDelegationId } from "@/lib/convexTypes";

interface Delegation {
  id: ManagerDelegationId;
  manager_id: string;
  delegate_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface ProfileMin { id: string; full_name: string | null; email: string | null; }

const ManagerDelegation = () => {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [profiles, setProfiles] = useState<ProfileMin[]>([]);
  const [delegateId, setDelegateId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const data = await convex.query(api.manager.getDelegationsPageData, {});
    setDelegations(data.delegations as Delegation[]);
    setProfiles(data.profiles as ProfileMin[]);
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [user]);

  const profileName = (id: string) => {
    const p = profiles.find((p) => p.id === id);
    return p?.full_name || p?.email || id.slice(0, 8);
  };

  const dateError = startDate && endDate && endDate < startDate ? "End date must be on or after start date" : null;

  const handleCreate = async () => {
    if (!user || !delegateId || !startDate || !endDate) return;
    if (dateError) { toast.error(dateError); return; }
    setSubmitting(true);
    try {
      await convex.mutation(api.manager.createDelegation, {
        delegateId,
        startDate,
        endDate,
      });
      toast.success("Delegation created");
      setDelegateId(""); setStartDate(""); setEndDate("");
      fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create delegation"));
    }
    setSubmitting(false);
  };

  const handleDeactivate = async (id: ManagerDelegationId) => {
    try {
      await convex.mutation(api.manager.deactivateDelegation, { delegationId: id });
      toast.success("Delegation deactivated");
      fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to deactivate delegation"));
    }
  };

  const otherProfiles = profiles.filter((p) => p.id !== user?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" /> Approval Delegation
        </h1>
        <p className="text-muted-foreground mt-1">Assign a temporary approver when you're away</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Delegation
          </CardTitle>
          <CardDescription>Your delegate will be able to approve/reject leave requests on your behalf during the specified period.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Delegate</Label>
              <Select value={delegateId} onValueChange={setDelegateId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  {otherProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11" />
              {dateError && <p className="text-xs text-destructive">{dateError}</p>}
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} disabled={submitting || !delegateId || !startDate || !endDate || !!dateError} className="h-11 w-full">
                {submitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Delegations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : delegations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No delegations yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegations.map((d) => {
                  const isManager = d.manager_id === user?.id;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm">{isManager ? "You delegated to" : "Delegated by"}</TableCell>
                      <TableCell className="font-medium">{profileName(isManager ? d.delegate_id : d.manager_id)}</TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {format(parseISO(d.start_date), "MMM d")} — {format(parseISO(d.end_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.is_active ? "default" : "secondary"}>
                          {d.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isManager && d.is_active && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deactivate Delegation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to deactivate this delegation to {profileName(d.delegate_id)}? They will no longer be able to approve requests on your behalf.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeactivate(d.id)}>Deactivate</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDelegation;
