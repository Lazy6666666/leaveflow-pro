import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Settings } from "lucide-react";

interface LeaveType { id: string; name: string; annual_allocation: number; carry_forward_limit: number; is_active: boolean; }

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

  useEffect(() => { fetchTypes(); }, []);

  const openNew = () => { setEditing(null); setName(""); setAllocation(0); setCarryForward(0); setIsActive(true); setDialogOpen(true); };
  const openEdit = (lt: LeaveType) => { setEditing(lt); setName(lt.name); setAllocation(lt.annual_allocation); setCarryForward(lt.carry_forward_limit); setIsActive(lt.is_active); setDialogOpen(true); };

  const handleSave = async () => {
    const payload = { name, annual_allocation: allocation, carry_forward_limit: carryForward, is_active: isActive };
    if (editing) {
      const { error } = await supabase.from("leave_types").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Leave type updated");
    } else {
      const { error } = await supabase.from("leave_types").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Leave type created");
    }
    setDialogOpen(false); fetchTypes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Leave Policies
          </h1>
          <p className="text-muted-foreground mt-1">Configure leave types and allocation rules</p>
        </div>
        <Button onClick={openNew} className="h-10"><Plus className="mr-2 h-4 w-4" /> Add Leave Type</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Leave Types</CardTitle>
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
              {leaveTypes.map((lt) => (
                <TableRow key={lt.id} className={!lt.is_active ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{lt.name}</TableCell>
                  <TableCell className="tabular-nums">{lt.annual_allocation} days</TableCell>
                  <TableCell className="tabular-nums hidden md:table-cell">{lt.carry_forward_limit} days</TableCell>
                  <TableCell>
                    <Badge variant={lt.is_active ? "default" : "secondary"} className="text-xs">
                      {lt.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEdit(lt)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Leave Type</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" /></div>
            <div className="space-y-2"><Label>Annual Allocation (days)</Label><Input type="number" value={allocation} onChange={(e) => setAllocation(Number(e.target.value))} className="h-11" /></div>
            <div className="space-y-2"><Label>Carry Forward Limit (days)</Label><Input type="number" value={carryForward} onChange={(e) => setCarryForward(Number(e.target.value))} className="h-11" /></div>
            <div className="flex items-center space-x-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Active</Label></div>
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
