import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface LeaveType {
  id: string;
  name: string;
  annual_allocation: number;
  carry_forward_limit: number;
  is_active: boolean;
}

const Policies = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [name, setName] = useState("");
  const [allocation, setAllocation] = useState(0);
  const [carryForward, setCarryForward] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchTypes = async () => {
    const { data } = await supabase.from("leave_types").select("*").order("name");
    if (data) setLeaveTypes(data);
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const openNew = () => {
    setEditing(null);
    setName("");
    setAllocation(0);
    setCarryForward(0);
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (lt: LeaveType) => {
    setEditing(lt);
    setName(lt.name);
    setAllocation(lt.annual_allocation);
    setCarryForward(lt.carry_forward_limit);
    setIsActive(lt.is_active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      const { error } = await supabase.from("leave_types").update({
        name, annual_allocation: allocation, carry_forward_limit: carryForward, is_active: isActive,
      }).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Leave type updated");
    } else {
      const { error } = await supabase.from("leave_types").insert({
        name, annual_allocation: allocation, carry_forward_limit: carryForward, is_active: isActive,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Leave type created");
    }
    setDialogOpen(false);
    fetchTypes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Policies</h1>
          <p className="text-muted-foreground">Configure leave types and allocation rules</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Leave Type</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Annual Allocation</TableHead>
                <TableHead>Carry Forward Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((lt) => (
                <TableRow key={lt.id}>
                  <TableCell className="font-medium">{lt.name}</TableCell>
                  <TableCell>{lt.annual_allocation} days</TableCell>
                  <TableCell>{lt.carry_forward_limit} days</TableCell>
                  <TableCell>{lt.is_active ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => openEdit(lt)}>Edit</Button>
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
            <DialogTitle>{editing ? "Edit" : "Add"} Leave Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Annual Allocation (days)</Label>
              <Input type="number" value={allocation} onChange={(e) => setAllocation(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Carry Forward Limit (days)</Label>
              <Input type="number" value={carryForward} onChange={(e) => setCarryForward(Number(e.target.value))} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Policies;
