import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  id: string;
  full_name: string | null;
  email: string | null;
  department_id: DepartmentId | null;
  site_id: string | null;
  manager_id: string | null;
  hourly_rate: number | null;
  base_salary: number | null;
  departments: { name: string } | null;
  site: { id: string; name: string | null } | null;
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

interface Site {
  id: string;
  name: string;
}

const EMPTY_VALUE = "-";

const Employees = () => {
  const { sessionId, roleScope, surface, trackOnce } = useAnalytics();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [allProfiles, setAllProfiles] = useState<{ id: string; full_name: string | null }[]>([]);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editDeptId, setEditDeptId] = useState<DepartmentId | "">("");
  const [editSiteId, setEditSiteId] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("employee");
  const [editHourlyRate, setEditHourlyRate] = useState("");
  const [editBaseSalary, setEditBaseSalary] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const data = await convex.query(api.admin.getEmployeesData, {});
    setEmployees(data.employees as Employee[]);
    setAllProfiles(data.employees.map((profile) => ({ id: profile.id, full_name: profile.full_name })));
    setRoles(data.roles as UserRole[]);
    setDepartments(data.departments as Department[]);
    setSites(data.sites as Site[]);
  };

  useEffect(() => {
    fetchAll().finally(() => setPageLoading(false));
  }, []);

  useEffect(() => {
    if (pageLoading) {
      return;
    }

    void trackOnce("employees_page_viewed", "employees_page_viewed", {
      employee_count: employees.length,
    });
  }, [employees.length, pageLoading, trackOnce]);

  const getRoles = (userId: string) => roles.filter((role) => role.user_id === userId).map((role) => role.role);
  const { page, totalPages, paginatedItems, setPage, totalItems } = usePagination(employees, 10);

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  const exportCSV = () => {
    const csv = buildCSV(
      ["Name", "Email", "Site", "Department", "Roles"],
      employees.map((employee) => [
        employee.full_name,
        employee.email,
        employee.site?.name,
        employee.departments?.name,
        getRoles(employee.id).join(", "),
      ]),
    );
    downloadCSV(csv, "employees.csv");
  };

  const openEdit = (employee: Employee) => {
    setEditEmployee(employee);
    setEditDeptId((employee.department_id ?? "") as DepartmentId | "");
    setEditSiteId(employee.site_id || "");
    setEditManagerId(employee.manager_id || "");
    setEditHourlyRate(employee.hourly_rate?.toString() ?? "");
    setEditBaseSalary(employee.base_salary?.toString() ?? "");

    const employeeRoles = getRoles(employee.id);
    setEditRole(
      employeeRoles.includes("hr_admin")
        ? "hr_admin"
        : employeeRoles.includes("manager")
          ? "manager"
          : "employee",
    );
  };

  const handleSave = async () => {
    if (!editEmployee) {
      return;
    }

    setSaving(true);

    try {
      const changedFields = [
        editEmployee.department_id !== (editDeptId || null) ? "department_id" : null,
        editEmployee.site_id !== (editSiteId || null) ? "site_id" : null,
        editEmployee.manager_id !== (editManagerId || null) ? "manager_id" : null,
        (editEmployee.hourly_rate ?? null) !== (editHourlyRate.trim() ? Number(editHourlyRate) : null)
          ? "hourly_rate"
          : null,
        (editEmployee.base_salary ?? null) !== (editBaseSalary.trim() ? Number(editBaseSalary) : null)
          ? "base_salary"
          : null,
        !getRoles(editEmployee.id).includes(editRole) ||
        getRoles(editEmployee.id).length !== (editRole === "hr_admin" ? 3 : editRole === "manager" ? 2 : 1)
          ? "role"
          : null,
      ].filter((value): value is string => Boolean(value));

      await convex.mutation(api.admin.updateEmployee, {
        employeeId: editEmployee.id,
        departmentId: editDeptId || undefined,
        siteId: editSiteId || undefined,
        managerId: editManagerId || undefined,
        hourlyRate: editHourlyRate.trim() ? Number(editHourlyRate) : undefined,
        baseSalary: editBaseSalary.trim() ? Number(editBaseSalary) : undefined,
        role: editRole,
        analytics: {
          sessionId,
          roleScope,
          surface,
          path: "/admin/hr-operations",
          changedFields,
        },
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
    switch (role) {
      case "hr_admin":
        return "destructive" as const;
      case "manager":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="flex items-center gap-2 text-3xl font-serif font-semibold tracking-tight text-foreground">
            <Users className="h-6 w-6 text-foreground" /> Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage employees, roles, and departments.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1 self-start sm:self-auto" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            All Employees <Badge variant="secondary" className="text-xs">{employees.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Site</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="hidden lg:table-cell">Manager</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.full_name || EMPTY_VALUE}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{employee.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {employee.site?.name || <span className="text-muted-foreground">{EMPTY_VALUE}</span>}
                  </TableCell>
                  <TableCell>
                    {employee.departments?.name || <span className="text-muted-foreground">{EMPTY_VALUE}</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {allProfiles.find((profile) => profile.id === employee.manager_id)?.full_name || (
                      <span className="text-muted-foreground">{EMPTY_VALUE}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getRoles(employee.id).map((role) => (
                        <Badge key={role} variant={roleColor(role)} className="text-[10px] capitalize">
                          {role.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEdit(employee)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} />
        </CardContent>
      </Card>

      <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
        <DialogContent className="sm:max-w-lg">
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
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="No department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Site</Label>
              <Select value={editSiteId || "none"} onValueChange={(value) => setEditSiteId(value === "none" ? "" : value)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="No site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No site</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <Select value={editManagerId} onValueChange={setEditManagerId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="No manager" />
                </SelectTrigger>
                <SelectContent>
                  {allProfiles
                    .filter((profile) => profile.id !== editEmployee?.id)
                    .map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || profile.id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(value) => setEditRole(value as AppRole)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="hr_admin">HR Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Hourly Rate</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editHourlyRate}
                  onChange={(event) => setEditHourlyRate(event.target.value)}
                  className="h-11"
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Base Salary</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editBaseSalary}
                  onChange={(event) => setEditBaseSalary(event.target.value)}
                  className="h-11"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmployee(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
