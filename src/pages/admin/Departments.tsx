import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { getErrorMessage } from "@/lib/errors";
import type { DepartmentId } from "@/lib/convexTypes";

interface Department { id: DepartmentId; name: string; created_at: string; }

const departmentDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatDepartmentDate = (date: string) => departmentDateFormatter.format(new Date(date));

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchDepartments = async () => {
    const data = await convex.query(api.admin.getDepartments, {});
    setDepartments(data as Department[]);
  };

  useEffect(() => { fetchDepartments().finally(() => setPageLoading(false)); }, []);

  if (pageLoading) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={4} cols={3} />
    </div>
  );

  const openCreate = () => { setEditingDept(null); setName(""); setDialogOpen(true); };
  const openEdit = (dept: Department) => { setEditingDept(dept); setName(dept.name); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await convex.mutation(api.admin.saveDepartment, {
        departmentId: editingDept?.id,
        name: name.trim(),
      });
      toast.success(editingDept ? "Department updated" : "Department created");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save department"));
    }
    setLoading(false); setDialogOpen(false); fetchDepartments();
  };

  const handleDialogSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSave();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await convex.mutation(api.admin.deleteDepartment, { departmentId: deleteTarget.id });
      toast.success("Department deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete department"));
    }
    setDeleteTarget(null); fetchDepartments();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-foreground" /> Departments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage company departments.</p>
        </div>
        <Button type="button" onClick={openCreate} className="h-10"><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
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
                    <TableCell className="text-muted-foreground">{formatDepartmentDate(dept.created_at)}</TableCell>
                    <TableCell className="space-x-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(dept)}
                        aria-label={`Edit ${dept.name} department`}
                        title={`Edit ${dept.name} department`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setDeleteTarget(dept)}
                        aria-label={`Delete ${dept.name} department`}
                        title={`Delete ${dept.name} department`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
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
          <form onSubmit={handleDialogSubmit}>
            <DialogHeader>
              <DialogTitle>{editingDept ? "Edit Department" : "New Department"}</DialogTitle>
              <DialogDescription>
                {editingDept ? "Update the department name." : "Create a department for organizing employees and reports."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dept-name">Department Name</Label>
                <Input
                  id="dept-name"
                  name="departmentName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  placeholder="e.g. Engineering"
                  className="h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading || !name.trim()}>{loading ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
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
