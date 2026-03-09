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
import { Pencil, RefreshCw, Wallet } from "lucide-react";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

interface Profile { id: string; full_name: string | null; email: string | null; }
interface LeaveType { id: string; name: string; annual_allocation: number; }
interface Balance { id: string; employee_id: string; leave_type_id: string; balance: number; year: number; leave_types: { name: string } | null; }

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
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: profiles }, { data: types }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").order("full_name"),
        supabase.from("leave_types").select("id, name, annual_allocation").eq("is_active", true),
      ]);
      if (profiles) setEmployees(profiles);
      if (types) setLeaveTypes(types);
    };
    fetch().finally(() => setPageLoading(false));
  }, []);

  const fetchBalances = async () => {
    if (!selectedEmployee || !year) return;
    const { data } = await supabase.from("leave_balances").select("*, leave_types(name)").eq("employee_id", selectedEmployee).eq("year", parseInt(year));
    if (data) setBalances(data as unknown as Balance[]);
  };

  useEffect(() => { if (selectedEmployee && year) fetchBalances(); }, [selectedEmployee, year]);

  if (pageLoading) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={4} cols={4} />
    </div>
  );

  const openAdjust = (bal: Balance) => { setAdjustTarget(bal); setNewBalance(bal.balance.toString()); setAdjustDialog(true); };

  const handleAdjust = async () => {
    if (!adjustTarget) return;
    const val = parseFloat(newBalance);
    if (isNaN(val) || val < 0) { toast.error("Balance must be a non-negative number"); return; }
    const { error } = await supabase.from("leave_balances").update({ balance: val }).eq("id", adjustTarget.id);
    if (error) toast.error(error.message);
    else { toast.success("Balance updated"); setAdjustDialog(false); fetchBalances(); }
  };

  const initializeForEmployee = async () => {
    if (!selectedEmployee || !year) return;
    setInitializing(true);
    for (const lt of leaveTypes) {
      const existing = balances.find((b) => b.leave_type_id === lt.id);
      if (!existing) await supabase.from("leave_balances").insert({ employee_id: selectedEmployee, leave_type_id: lt.id, year: parseInt(year), balance: lt.annual_allocation });
    }
    toast.success("Balances initialized"); setInitializing(false); fetchBalances();
  };

  const bulkInitialize = async () => {
    setInitializing(true);
    const y = parseInt(year);
    
    // Fetch all existing balances for this year in one query
    const { data: existingBalances } = await supabase
      .from("leave_balances")
      .select("employee_id, leave_type_id")
      .eq("year", y);
    
    const existingSet = new Set(
      (existingBalances || []).map((b) => `${b.employee_id}:${b.leave_type_id}`)
    );
    
    // Build batch of missing balances
    const toInsert: { employee_id: string; leave_type_id: string; year: number; balance: number }[] = [];
    for (const emp of employees) {
      for (const lt of leaveTypes) {
        if (!existingSet.has(`${emp.id}:${lt.id}`)) {
          toInsert.push({ employee_id: emp.id, leave_type_id: lt.id, year: y, balance: lt.annual_allocation });
        }
      }
    }
    
    if (toInsert.length > 0) {
      // Insert in batches of 500
      for (let i = 0; i < toInsert.length; i += 500) {
        const batch = toInsert.slice(i, i + 500);
        const { error } = await supabase.from("leave_balances").insert(batch);
        if (error) { toast.error(error.message); setInitializing(false); return; }
      }
    }
    
    toast.success(`Balances initialized for all ${employees.length} employees (${toInsert.length} new records)`);
    setInitializing(false);
    if (selectedEmployee) fetchBalances();
  };

  const employeeLabel = (e: Profile) => e.full_name || e.email || e.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" /> Leave Balances
        </h1>
        <p className="text-muted-foreground mt-1">View and adjust employee leave balances</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Select Employee & Year</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[240px]">
              <Label>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{employeeLabel(e)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-[120px]">
              <Label>Year</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={2020} max={2030} className="h-11" />
            </div>
            {selectedEmployee && (
              <Button variant="outline" className="h-11" onClick={initializeForEmployee} disabled={initializing}>
                <RefreshCw className="mr-2 h-4 w-4" /> Initialize Year
              </Button>
            )}
            <Button variant="secondary" className="h-11" onClick={bulkInitialize} disabled={initializing}>
              {initializing ? "Initializing..." : "Bulk Initialize All"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Balances for {year} <Badge variant="secondary" className="text-xs">{balances.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balances.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No balances found. Click "Initialize Year" to create defaults.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Balance (days)</TableHead>
                    <TableHead className="w-20">Adjust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((bal) => (
                    <TableRow key={bal.id}>
                      <TableCell className="font-medium">{bal.leave_types?.name}</TableCell>
                      <TableCell className="tabular-nums">{bal.balance}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openAdjust(bal)}><Pencil className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>Adjust Balance — {adjustTarget?.leave_types?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Balance (days)</Label>
              <Input type="number" step="0.5" min="0" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} className="h-11" />
              {newBalance && parseFloat(newBalance) < 0 && <p className="text-xs text-destructive">Balance cannot be negative</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(false)}>Cancel</Button>
            <Button onClick={handleAdjust} disabled={!newBalance || parseFloat(newBalance) < 0}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Balances;
