import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown, Save, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Id } from "../../../convex/_generated/dataModel";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function RosterAssignment() {
  const { toast } = useToast();
  
  // Queries
  const employeesData = useQuery(api.adminCore.getEmployeesData);
  const shifts = useQuery(api.shifts.getActiveShifts);
  const weeklyOffRules = useQuery(api.rosters.getWeeklyOffRules);

  // State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  
  // Assignment Form State
  const [targetShiftId, setTargetShiftId] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  // Weekly Off State
  const [selectedOffDays, setSelectedOffDays] = useState<number[]>([]);
  const [savingOffDays, setSavingOffDays] = useState(false);

  // Derived Data
  const employees = useMemo(() => employeesData?.employees || [], [employeesData]);
  
  const rosters = useQuery(api.rosters.getEmployeeRosters, 
    selectedEmployeeId ? { employeeId: selectedEmployeeId } : "skip"
  );

  const assignRoster = useMutation(api.rosters.assignRoster);
  const setWeeklyOffRule = useMutation(api.rosters.setWeeklyOffRule);

  // Handlers
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setOpenCombobox(false);
    
    // Reset form
    setTargetShiftId("");
    
    // Load existing weekly off rule if any
    if (weeklyOffRules) {
      const rule = weeklyOffRules.find(r => r.scope === "employee" && r.scopeId === employeeId);
      setSelectedOffDays(rule ? rule.offDays : []);
    }
  };

  const handleAssignRoster = async () => {
    if (!selectedEmployeeId || !targetShiftId || !effectiveDate) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    try {
      await assignRoster({
        employeeId: selectedEmployeeId,
        shiftId: targetShiftId as Id<"shifts">,
        effectiveFrom: effectiveDate,
      });
      toast({ title: "Roster assigned successfully" });
      setTargetShiftId("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ 
        title: "Assignment failed", 
        description: message, 
        variant: "destructive" 
      });
    }
  };

  const handleSaveOffDays = async () => {
    if (!selectedEmployeeId) return;
    setSavingOffDays(true);
    try {
      await setWeeklyOffRule({
        scope: "employee",
        scopeId: selectedEmployeeId,
        offDays: selectedOffDays,
      });
      toast({ title: "Weekly off days updated" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ 
        title: "Update failed", 
        description: message, 
        variant: "destructive" 
      });
    } finally {
      setSavingOffDays(false);
    }
  };

  const toggleOffDay = (day: number) => {
    setSelectedOffDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Render Helpers
  const getShiftName = (shiftId: string) => {
    return shifts?.find(s => s._id === shiftId)?.name || "Unknown Shift";
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
       <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Roster Assignment
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage employee shift assignments and weekly offs
          </p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Selection */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Employee</CardTitle>
              <CardDescription>Choose an employee to manage</CardDescription>
            </CardHeader>
            <CardContent>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                  >
                    {selectedEmployeeId
                      ? employees.find((e) => e.id === selectedEmployeeId)?.full_name || "Select employee..."
                      : "Select employee..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search employee..." />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup>
                        {employees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={employee.full_name || employee.email || employee.id}
                            onSelect={() => handleEmployeeSelect(employee.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {employee.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {selectedEmployeeId && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Off Rules</CardTitle>
                <CardDescription>Set specific off days for this employee</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`day-${day.value}`}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedOffDays.includes(day.value)}
                        onChange={() => toggleOffDay(day.value)}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-sm font-normal">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveOffDays} disabled={savingOffDays} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Off Days
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Right Column: Roster Management */}
        <div className="lg:col-span-8 space-y-6">
          {selectedEmployeeId ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Assign New Roster</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Shift Template</Label>
                      <Select value={targetShiftId} onValueChange={setTargetShiftId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                        <SelectContent>
                          {shifts?.map((shift) => (
                            <SelectItem key={shift._id} value={shift._id}>
                              {shift.name} ({shift.startTime}-{shift.endTime})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Effective From</Label>
                      <Input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAssignRoster} disabled={!targetShiftId}>
                      Assign Shift
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Roster History</CardTitle>
                  <CardDescription>
                    History of shift assignments for {employees.find(e => e.id === selectedEmployeeId)?.full_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!rosters || rosters.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                       No roster history found.
                     </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Shift Name</TableHead>
                          <TableHead>Effective From</TableHead>
                          <TableHead>Effective To</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rosters.map((roster) => (
                          <TableRow key={roster._id}>
                            <TableCell className="font-medium">{getShiftName(roster.shiftId)}</TableCell>
                            <TableCell>{roster.effectiveFrom}</TableCell>
                            <TableCell>{roster.effectiveTo || "Present"}</TableCell>
                            <TableCell>
                              {!roster.effectiveTo ? (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
                              ) : (
                                <Badge variant="outline">Historic</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
              <User className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No Employee Selected</p>
              <p className="text-sm">Select an employee from the left to view and manage their roster.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
