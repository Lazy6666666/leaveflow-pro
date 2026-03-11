import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Download } from "lucide-react";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import { buildCSV, downloadCSV } from "@/lib/csv";
import { getErrorMessage } from "@/lib/errors";
import type { DepartmentId } from "@/lib/convexTypes";

type AppRole = "employee" | "manager" | "hr_admin";

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
  const [editDeptId, setEditDeptId] = useState<DepartmentId | "">("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("employee");
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const data = await convex.query(api.admin.getEmployeesData, {});
    setEmployees(data.employees as Employee[]);
    setAllProfiles(data.employees.map((p) => ({ id: p.id, full_name: p.full_name })));
    setRoles(data.roles as UserRole[]);
    setDepartments(data.departments as Department[]);
  };

  useEffect(() => { fetchAll().finally(() => setPageLoading(false)); }, []);

  const getRoles = (userId: string) => roles.filter((r) => r.user_id === userId).map((r) => r.role);
  const { page, totalPages, paginatedItems, setPage, totalItems } = usePagination(employees, 10);

  if (pageLoading) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );

  const exportCSV = () => {
    const csv = buildCSV(
      ["Name", "Email", "Department", "Roles"],
      employees.map((e) => [e.full_name, e.email, e.departments?.name, getRoles(e.id).join(", ")])
    );
    downloadCSV(csv, "employees.csv");
  };

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp); setEditDeptId(emp.department_id || ""); setEditManagerId(emp.manager_id || "");
    const empRoles = getRoles(emp.id);
    setEditRole(empRoles.includes("hr_admin") ? "hr_admin" : empRoles.includes("manager") ? "manager" : "employee");
  };

  const handleSave = async () => {
    if (!editEmployee) return;
    setSaving(true);
    try {
      await convex.mutation(api.admin.updateEmployee, {
        employeeId: editEmployee.id,
        departmentId: editDeptId || undefined,
        managerId: editManagerId || undefined,
        role: editRole,
      });
      toast.success("Employee updated");
      setEditEmployee(null);
      fetchAll();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update employee"));
    }
    setSaving(false);
  };

  const roleColor = (role: AppRole) => {
    switch (role) { case "hr_admin": return "destructive" as const; case "manager": return "default" as const; default: return "secondary" as const; }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-foreground" /> Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage employees, roles, and departments.</p>
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
              {paginatedItems.map((emp) => (
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
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} />
        </CardContent>
      </Card>

      <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee: {editEmployee?.full_name || editEmployee?.email}</DialogTitle>
            <DialogDescription>
              Update the employee department, manager, and application role assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
                <Select value={editDeptId} onValueChange={(value) => setEditDeptId(value as DepartmentId)}>
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
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
