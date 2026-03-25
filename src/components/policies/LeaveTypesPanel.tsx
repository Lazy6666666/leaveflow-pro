import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { getErrorMessage } from "@/lib/errors";
import type { LeaveTypeId } from "@/lib/convexTypes";
import { Plus } from "lucide-react";
import { toast } from "sonner";

type LeaveType = {
  id: LeaveTypeId;
  name: string;
  annual_allocation: number;
  carry_forward_limit: number;
  is_active: boolean;
};

export function LeaveTypesPanel() {
  const { sessionId, roleScope, surface, trackOnce } = useAnalytics();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [name, setName] = useState("");
  const [allocation, setAllocation] = useState(0);
  const [carryForward, setCarryForward] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    const data = await convex.query(api.admin.getLeavePolicies, {});
    setLeaveTypes(data as LeaveType[]);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    void trackOnce("leave_types_panel_viewed", "leave_types_panel_viewed", {
      leave_type_count: leaveTypes.length,
      path: "/admin/system",
      roleScope,
      sessionId,
      surface,
    });
  }, [leaveTypes.length, loading, roleScope, sessionId, surface, trackOnce]);

  const openNewLeaveType = () => {
    setEditingLeaveType(null);
    setName("");
    setAllocation(0);
    setCarryForward(0);
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEditLeaveType = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
    setName(leaveType.name);
    setAllocation(leaveType.annual_allocation);
    setCarryForward(leaveType.carry_forward_limit);
    setIsActive(leaveType.is_active);
    setDialogOpen(true);
  };

  const handleSaveLeaveType = async () => {
    try {
      await convex.mutation(api.admin.saveLeaveType, {
        leaveTypeId: editingLeaveType?.id,
        name,
        annualAllocation: allocation,
        carryForwardLimit: carryForward,
        isActive,
        analytics: {
          sessionId,
          roleScope,
          surface,
          path: "/admin/system",
        },
      });
      toast.success(editingLeaveType ? "Leave type updated" : "Leave type created");
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save leave type"));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Leave policy configuration</h2>
          <p className="text-sm text-muted-foreground">Configure leave types, allocations, and carry-forward rules.</p>
        </div>
        <Button onClick={openNewLeaveType} className="h-10">
          <Plus className="mr-2 h-4 w-4" /> Add Leave Type
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Leave Types</CardTitle>
          <CardDescription>These rules continue to drive leave balance allocation and approvals.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Annual Allocation</TableHead>
                <TableHead className="hidden md:table-cell">Carry Forward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((leaveType) => (
                <TableRow key={leaveType.id} className={!leaveType.is_active ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{leaveType.name}</TableCell>
                  <TableCell className="tabular-nums">{leaveType.annual_allocation} days</TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{leaveType.carry_forward_limit} days</TableCell>
                  <TableCell>
                    <Badge variant={leaveType.is_active ? "default" : "secondary"} className="text-xs">
                      {leaveType.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEditLeaveType(leaveType)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLeaveType ? "Edit" : "Add"} Leave Type</DialogTitle>
            <DialogDescription>
              Configure the leave type name, annual allocation, carry forward limit, and active status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Annual Allocation (days)</Label>
              <Input type="number" value={allocation} onChange={(event) => setAllocation(Number(event.target.value))} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Carry Forward Limit (days)</Label>
              <Input type="number" value={carryForward} onChange={(event) => setCarryForward(Number(event.target.value))} className="h-11" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveLeaveType()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
