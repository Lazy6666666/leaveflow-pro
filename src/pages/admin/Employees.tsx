import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";

type AppRole = Enums<"app_role">;

interface Employee {
  id: string;
  full_name: string | null;
  email: string | null;
  department_id: string | null;
  manager_id: string | null;
  departments: { name: string } | null;
  manager: { full_name: string | null } | null;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

interface Department {
  id: string;
  name: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
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
    if (empRes.data) {
      setEmployees(empRes.data as unknown as Employee[]);
      setAllProfiles(empRes.data.map((p) => ({ id: p.id, full_name: p.full_name })));
    }
    if (roleRes.data) setRoles(roleRes.data);
    if (deptRes.data) setDepartments(deptRes.data);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const getRoles = (userId: string) => roles.filter((r) => r.user_id === userId).map((r) => r.role);

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setEditDeptId(emp.department_id || "");
    setEditManagerId(emp.manager_id || "");
    const empRoles = getRoles(emp.id);
    setEditRole(empRoles.includes("hr_admin") ? "hr_admin" : empRoles.includes("manager") ? "manager" : "employee");
  };

  const handleSave = async () => {
    if (!editEmployee) return;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        department_id: editDeptId || null,
        manager_id: editManagerId || null,
      })
      .eq("id", editEmployee.id);

    if (profileError) {
      toast.error(profileError.message);
      return;
    }

    // Update role: delete existing, insert new
    await supabase.from("user_roles").delete().eq("user_id", editEmployee.id);
    const rolesToInsert: { user_id: string; role: AppRole }[] = [{ user_id: editEmployee.id, role: "employee" }];
    if (editRole === "manager") rolesToInsert.push({ user_id: editEmployee.id, role: "manager" });
    if (editRole === "hr_admin") {
      rolesToInsert.push({ user_id: editEmployee.id, role: "manager" });
      rolesToInsert.push({ user_id: editEmployee.id, role: "hr_admin" });
    }
    await supabase.from("user_roles").insert(rolesToInsert);

    toast.success("Employee updated");
    setEditEmployee(null);
    fetchAll();
  };

  const roleColor = (role: AppRole) => {
    switch (role) {
      case "hr_admin": return "destructive" as const;
      case "manager": return "default" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employees</h1>
        <p className="text-muted-foreground">Manage employees, roles, and departments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.full_name || "—"}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.departments?.name || "—"}</TableCell>
                  <TableCell>{allProfiles.find((p) => p.id === emp.manager_id)?.full_name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {getRoles(emp.id).map((r) => (
                        <Badge key={r} variant={roleColor(r)}>{r}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => openEdit(emp)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee: {editEmployee?.full_name || editEmployee?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={editDeptId} onValueChange={setEditDeptId}>
                <SelectTrigger>
                  <SelectValue placeholder="No department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <Select value={editManagerId} onValueChange={setEditManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="No manager" />
                </SelectTrigger>
                <SelectContent>
                  {allProfiles
                    .filter((p) => p.id !== editEmployee?.id)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || p.id}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
