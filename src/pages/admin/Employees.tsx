import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Download } from "lucide-react";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import type { Enums } from "@/integrations/supabase/types";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";

type AppRole = Enums<"app_role">;

interface Employee {
  id: string; full_name: string | null; email: string | null;
  department_id: string | null; manager_id: string | null;
  departments: { name: string } | null; manager: { full_name: string | null } | null;
}

interface UserRole { user_id: string; role: AppRole; }
interface Department { id: string; name: string; }

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allProfiles, setAllProfiles] = useState<{ id: string; full_name: string | null }[]>([]);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editDeptId, setEditDeptId] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("employee");

  const fetchAll = async () => {
    const [empRes, roleRes, deptRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, department_id, manager_id, departments(name)"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("departments").select("id, name"),
    ]);
    if (empRes.data) { setEmployees(empRes.data as unknown as Employee[]); setAllProfiles(empRes.data.map((p) => ({ id: p.id, full_name: p.full_name }))); }
    if (roleRes.data) setRoles(roleRes.data);
    if (deptRes.data) setDepartments(deptRes.data);
  };

  useEffect(() => { fetchAll().finally(() => setPageLoading(false)); }, []);

  if (pageLoading) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );

  const getRoles = (userId: string) => roles.filter((r) => r.user_id === userId).map((r) => r.role);
  const { page, totalPages, paginatedItems, setPage, totalItems } = usePagination(employees, 10);

  const exportCSV = () => {
    const header = "Name,Email,Department,Roles\n";
    const rows = employees.map((e) => `"${e.full_name || ""}","${e.email || ""}","${e.departments?.name || ""}","${getRoles(e.id).join(", ")}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "employees.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp); setEditDeptId(emp.department_id || ""); setEditManagerId(emp.manager_id || "");
    const empRoles = getRoles(emp.id);
    setEditRole(empRoles.includes("hr_admin") ? "hr_admin" : empRoles.includes("manager") ? "manager" : "employee");
  };

  const handleSave = async () => {
    if (!editEmployee) return;
    const { error } = await supabase.from("profiles").update({ department_id: editDeptId || null, manager_id: editManagerId || null }).eq("id", editEmployee.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("user_roles").delete().eq("user_id", editEmployee.id);
    const rolesToInsert: { user_id: string; role: AppRole }[] = [{ user_id: editEmployee.id, role: "employee" }];
    if (editRole === "manager") rolesToInsert.push({ user_id: editEmployee.id, role: "manager" });
    if (editRole === "hr_admin") { rolesToInsert.push({ user_id: editEmployee.id, role: "manager" }); rolesToInsert.push({ user_id: editEmployee.id, role: "hr_admin" }); }
    await supabase.from("user_roles").insert(rolesToInsert);
    toast.success("Employee updated"); setEditEmployee(null); fetchAll();
  };

  const roleColor = (role: AppRole) => {
    switch (role) { case "hr_admin": return "destructive" as const; case "manager": return "default" as const; default: return "secondary" as const; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Employees
          </h1>
          <p className="text-muted-foreground mt-1">Manage employees, roles, and departments</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            All Employees <Badge variant="secondary" className="text-xs">{employees.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="hidden lg:table-cell">Manager</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{emp.email}</TableCell>
                  <TableCell>{emp.departments?.name || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="hidden lg:table-cell">{allProfiles.find((p) => p.id === emp.manager_id)?.full_name || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {getRoles(emp.id).map((r) => <Badge key={r} variant={roleColor(r)} className="text-[10px] capitalize">{r.replace("_", " ")}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEdit(emp)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Employee: {editEmployee?.full_name || editEmployee?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={editDeptId} onValueChange={setEditDeptId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="No department" /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <Select value={editManagerId} onValueChange={setEditManagerId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="No manager" /></SelectTrigger>
                <SelectContent>{allProfiles.filter((p) => p.id !== editEmployee?.id).map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.id}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="hr_admin">HR Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmployee(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
