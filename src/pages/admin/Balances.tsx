import { useCallback, useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
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
import { getErrorMessage } from "@/lib/errors";
import type { LeaveBalanceId, LeaveTypeId } from "@/lib/convexTypes";

interface Profile { id: string; full_name: string | null; email: string | null; }
interface Balance { id: LeaveBalanceId; employee_id: string; leave_type_id: LeaveTypeId; balance: number; year: number; leave_types: { name: string } | null; }

const currentYear = new Date().getFullYear();
const EMPLOYEE_SELECT_ID = "balances-employee";
const YEAR_INPUT_ID = "balances-year";
const BALANCE_INPUT_ID = "new-balance";

const Balances = () => {
  const [employees, setEmployees] = useState<Profile[]>([]);
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
      const data = await convex.query(api.admin.getBalancesData, { year: currentYear });
      setEmployees(data.employees as Profile[]);
    };
    fetch().finally(() => setPageLoading(false));
  }, []);

  const fetchBalances = useCallback(async () => {
    if (!selectedEmployee || !year) return;
    const data = await convex.query(api.admin.getBalancesData, { employeeId: selectedEmployee, year: Number.parseInt(year, 10) });
    setBalances(data.balances as Balance[]);
  }, [selectedEmployee, year]);

  useEffect(() => {
    if (selectedEmployee && year) {
      void fetchBalances();
    }
  }, [fetchBalances, selectedEmployee, year]);

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
    try {
      await convex.mutation(api.admin.adjustBalance, { balanceId: adjustTarget.id, balance: val });
      toast.success("Balance updated");
      setAdjustDialog(false);
      void fetchBalances();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update balance"));
    }
  };

  const initializeForEmployee = async () => {
    if (!selectedEmployee || !year) return;
    setInitializing(true);
    try {
      await convex.mutation(api.admin.initializeEmployeeBalances, { employeeId: selectedEmployee, year: Number.parseInt(year, 10) });
      toast.success("Balances initialized");
      await fetchBalances();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to initialize balances"));
    } finally {
      setInitializing(false);
    }
  };

  const bulkInitialize = async () => {
    setInitializing(true);
    try {
      const result = await convex.mutation(api.admin.bulkInitializeBalances, { year: Number.parseInt(year, 10) });
      toast.success(`Balances initialized for all ${result.totalEmployees} employees`);
      if (selectedEmployee) await fetchBalances();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to initialize balances"));
    } finally {
      setInitializing(false);
    }
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
              <Label htmlFor={EMPLOYEE_SELECT_ID}>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id={EMPLOYEE_SELECT_ID} className="h-11" aria-label="Employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{employeeLabel(e)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-[120px]">
              <Label htmlFor={YEAR_INPUT_ID}>Year</Label>
              <Input id={YEAR_INPUT_ID} name="year" type="number" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} min={2020} max={2030} className="h-11" />
            </div>
            {selectedEmployee && (
              <Button variant="outline" className="h-11" onClick={initializeForEmployee} disabled={initializing}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" /> Initialize Year
              </Button>
            )}
            <Button variant="secondary" className="h-11" onClick={bulkInitialize} disabled={initializing}>
              {initializing ? "Initializing…" : "Bulk Initialize All"}
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
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openAdjust(bal)}
                          aria-label={`Adjust ${bal.leave_types?.name ?? "leave"} balance`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
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
          <DialogHeader><DialogTitle>Adjust Balance — {adjustTarget?.leave_types?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={BALANCE_INPUT_ID}>New Balance (days)</Label>
              <Input id={BALANCE_INPUT_ID} name="newBalance" type="number" step="0.5" min="0" inputMode="decimal" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} className="h-11" />
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
