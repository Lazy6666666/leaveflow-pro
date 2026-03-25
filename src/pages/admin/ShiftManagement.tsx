import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { Id } from "../../../convex/_generated/dataModel";

// --- Schema & Types ---

const shiftSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  gracePeriodMinutes: z.coerce.number().min(0),
  overtimeThresholdMinutes: z.coerce.number().min(0),
  workDays: z.array(z.number()).min(1, "Select at least one work day"),
});

type ShiftFormValues = z.infer<typeof shiftSchema>;

type ShiftSummary = {
  _id: Id<"shifts">;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  overtimeThresholdMinutes: number;
  workDays: number[];
  isActive: boolean;
};

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

// --- Main Component ---

export default function ShiftManagement() {
  const shifts = useQuery(api.shifts.getShifts);
  const createShift = useMutation(api.shifts.createShift);
  const updateShift = useMutation(api.shifts.updateShift);
  const deleteShift = useMutation(api.shifts.deleteShift);
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<Id<"shifts"> | null>(null);

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      name: "",
      startTime: "09:00",
      endTime: "18:00",
      gracePeriodMinutes: 15,
      overtimeThresholdMinutes: 60,
      workDays: [1, 2, 3, 4, 5], // Mon-Fri default
    },
  });

  const handleCreateOpen = () => {
    setEditingShiftId(null);
    form.reset({
      name: "",
      startTime: "09:00",
      endTime: "18:00",
      gracePeriodMinutes: 15,
      overtimeThresholdMinutes: 60,
      workDays: [1, 2, 3, 4, 5],
    });
    setIsDialogOpen(true);
  };

  const handleEditOpen = (shift: ShiftSummary) => {
    setEditingShiftId(shift._id);
    form.reset({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriodMinutes: shift.gracePeriodMinutes,
      overtimeThresholdMinutes: shift.overtimeThresholdMinutes,
      workDays: shift.workDays,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ShiftFormValues) => {
    try {
      if (editingShiftId) {
        await updateShift({
          shiftId: editingShiftId,
          ...data,
        });
        toast({ title: "Shift updated successfully" });
      } else {
        await createShift(data);
        toast({ title: "Shift created successfully" });
      }
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message || "Failed to save shift",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (shiftId: Id<"shifts">) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;
    try {
      await deleteShift({ shiftId });
      toast({ title: "Shift deleted" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Deletion failed",
        description: message, // Likely "in use" error
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (shift: ShiftSummary) => {
    try {
      await updateShift({
        shiftId: shift._id,
        isActive: !shift.isActive,
      });
      toast({ title: shift.isActive ? "Shift deactivated" : "Shift activated" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (shifts === undefined) {
    return <div className="p-8 text-muted-foreground">Loading shifts...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Shift Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Define work schedules and shift templates
          </p>
        </div>
        <Button onClick={handleCreateOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Shift
        </Button>
      </div>

      {shifts.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No shifts defined</AlertTitle>
          <AlertDescription>
            Create your first shift template to start assigning schedules to employees.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.map((shift) => (
            <Card key={shift._id} className={cn("relative transition-all", !shift.isActive && "opacity-60 grayscale")}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-medium">{shift.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                      <Clock className="h-3 w-3" />
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                  <Badge variant={shift.isActive ? "default" : "secondary"}>
                    {shift.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <span
                      key={day.value}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-medium border",
                        shift.workDays.includes(day.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-transparent"
                      )}
                    >
                      {day.label.charAt(0)}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">Grace:</span> {shift.gracePeriodMinutes}m
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">OT Threshold:</span> {shift.overtimeThresholdMinutes}m
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                   <Switch
                      checked={shift.isActive}
                      onCheckedChange={() => handleToggleActive(shift)}
                      aria-label="Toggle active status"
                   />
                   <span className="text-xs text-muted-foreground">{shift.isActive ? "On" : "Off"}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditOpen(shift)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(shift._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingShiftId ? "Edit Shift" : "Create New Shift"}</DialogTitle>
            <DialogDescription>
              Configure the working hours and rules for this shift template.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shift Name</Label>
              <Input id="name" placeholder="e.g. Morning Shift" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" {...form.register("startTime")} />
                {form.formState.errors.startTime && (
                  <p className="text-xs text-destructive">{form.formState.errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" {...form.register("endTime")} />
                {form.formState.errors.endTime && (
                  <p className="text-xs text-destructive">{form.formState.errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Work Days</Label>
              <div className="flex flex-wrap gap-2">
                <Controller
                  control={form.control}
                  name="workDays"
                  render={({ field }) => (
                    <>
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = field.value.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value.filter((v) => v !== day.value)
                                : [...field.value, day.value];
                              field.onChange(newValue);
                            }}
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors border",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                            )}
                          >
                            {day.label.slice(0, 3)}
                          </button>
                        );
                      })}
                    </>
                  )}
                />
              </div>
              {form.formState.errors.workDays && (
                <p className="text-xs text-destructive">{form.formState.errors.workDays.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gracePeriod">Grace Period (min)</Label>
                <Input id="gracePeriod" type="number" min={0} {...form.register("gracePeriodMinutes")} />
                <p className="text-[10px] text-muted-foreground">Late mark applied after this</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otThreshold">OT Threshold (min)</Label>
                <Input id="otThreshold" type="number" min={0} {...form.register("overtimeThresholdMinutes")} />
                <p className="text-[10px] text-muted-foreground">Overtime starts after this</p>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingShiftId ? "Save Changes" : "Create Shift"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
