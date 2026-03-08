import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, RefreshCw } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface LeaveType {
  id: string;
  name: string;
  annual_allocation: number;
}

interface Balance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  balance: number;
  year: number;
  leave_types: { name: string } | null;
}

const currentYear = new Date().getFullYear();

const Balances = () => {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [year, setYear] = useState(currentYear.toString());
  const [balances, setBalances] = useState<Balance[]>([]);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Balance | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: profiles }, { data: types }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").order("full_name"),
        supabase.from("leave_types").select("id, name, annual_allocation").eq("is_active", true),
      ]);
      if (profiles) setEmployees(profiles);
      if (types) setLeaveTypes(types);
    };
    fetch();
  }, []);

  const fetchBalances = async () => {
    if (!selectedEmployee || !year) return;
    const { data } = await supabase
      .from("leave_balances")
      .select("*, leave_types(name)")
      .eq("employee_id", selectedEmployee)
      .eq("year", parseInt(year));
    if (data) setBalances(data as unknown as Balance[]);
  };

  useEffect(() => {
    if (selectedEmployee && year) fetchBalances();
  }, [selectedEmployee, year]);

  const openAdjust = (bal: Balance) => {
    setAdjustTarget(bal);
    setNewBalance(bal.balance.toString());
    setAdjustDialog(true);
  };

  const handleAdjust = async () => {
    if (!adjustTarget) return;
    const { error } = await supabase
      .from("leave_balances")
      .update({ balance: parseFloat(newBalance) })
      .eq("id", adjustTarget.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Balance updated");
      setAdjustDialog(false);
      fetchBalances();
    }
  };

  const initializeForEmployee = async () => {
    if (!selectedEmployee || !year) return;
    setInitializing(true);

    // Upsert balances for each active leave type
    for (const lt of leaveTypes) {
      const existing = balances.find((b) => b.leave_type_id === lt.id);
      if (!existing) {
        await supabase.from("leave_balances").insert({
          employee_id: selectedEmployee,
          leave_type_id: lt.id,
          year: parseInt(year),
          balance: lt.annual_allocation,
        });
      }
    }

    toast.success("Balances initialized");
    setInitializing(false);
    fetchBalances();
  };

  const bulkInitialize = async () => {
    setInitializing(true);
    const y = parseInt(year);

    for (const emp of employees) {
      for (const lt of leaveTypes) {
        // Check if balance exists
        const { data: existing } = await supabase
          .from("leave_balances")
          .select("id")
          .eq("employee_id", emp.id)
          .eq("leave_type_id", lt.id)
          .eq("year", y)
          .maybeSingle();

        if (!existing) {
          await supabase.from("leave_balances").insert({
            employee_id: emp.id,
            leave_type_id: lt.id,
            year: y,
            balance: lt.annual_allocation,
          });
        }
      }
    }

    toast.success(`Balances initialized for all ${employees.length} employees`);
    setInitializing(false);
    if (selectedEmployee) fetchBalances();
  };

  const employeeLabel = (e: Profile) => e.full_name || e.email || e.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leave Balances</h1>
        <p className="text-muted-foreground">View and adjust employee leave balances</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Employee & Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[240px]">
              <Label>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {employeeLabel(e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-[120px]">
              <Label>Year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={2020}
                max={2030}
              />
            </div>
            {selectedEmployee && (
              <Button variant="outline" onClick={initializeForEmployee} disabled={initializing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Initialize Year
              </Button>
            )}
            <Button variant="secondary" onClick={bulkInitialize} disabled={initializing}>
              {initializing ? "Initializing..." : "Bulk Initialize All Employees"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <Card>
          <CardHeader>
            <CardTitle>Balances for {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {balances.length === 0 ? (
              <p className="text-muted-foreground">No balances found. Click "Initialize Year" to create defaults.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Balance (days)</TableHead>
                    <TableHead className="w-[80px]">Adjust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((bal) => (
                    <TableRow key={bal.id}>
                      <TableCell className="font-medium">{bal.leave_types?.name}</TableCell>
                      <TableCell>{bal.balance}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => openAdjust(bal)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Balance — {adjustTarget?.leave_types?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Balance (days)</Label>
              <Input
                type="number"
                step="0.5"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(false)}>Cancel</Button>
            <Button onClick={handleAdjust}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Balances;
