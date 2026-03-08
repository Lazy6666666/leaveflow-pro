import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

interface Department { id: string; name: string; created_at: string; }

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = async () => {
    const { data } = await supabase.from("departments").select("*").order("name");
    if (data) setDepartments(data);
  };

  useEffect(() => { fetchDepartments(); }, []);

  const openCreate = () => { setEditingDept(null); setName(""); setDialogOpen(true); };
  const openEdit = (dept: Department) => { setEditingDept(dept); setName(dept.name); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    if (editingDept) {
      const { error } = await supabase.from("departments").update({ name: name.trim() }).eq("id", editingDept.id);
      if (error) toast.error(error.message); else toast.success("Department updated");
    } else {
      const { error } = await supabase.from("departments").insert({ name: name.trim() });
      if (error) toast.error(error.message); else toast.success("Department created");
    }
    setLoading(false); setDialogOpen(false); fetchDepartments();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("departments").delete().eq("id", deleteTarget.id);
    if (error) toast.error(error.message); else toast.success("Department deleted");
    setDeleteTarget(null); fetchDepartments();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Departments
          </h1>
          <p className="text-muted-foreground mt-1">Manage company departments</p>
        </div>
        <Button onClick={openCreate} className="h-10"><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            All Departments <Badge variant="secondary" className="text-xs">{departments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No departments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-muted-foreground">{format(parseISO(dept.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="space-x-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(dept)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteTarget(dept)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingDept ? "Edit Department" : "New Department"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Department Name</Label>
              <Input id="dept-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering" className="h-11" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !name.trim()}>{loading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Departments;
