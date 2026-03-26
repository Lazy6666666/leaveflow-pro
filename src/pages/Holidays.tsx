import { useState } from "react";
import { useRole } from "@/hooks/useRole";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarHeart } from "lucide-react";
import { parseISO } from "date-fns";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { getErrorMessage } from "@/lib/errors";
import type { PublicHolidayId } from "@/lib/convexTypes";
import { useConvexMutation } from "@/hooks/useConvexMutation";
import { useConvexQuery } from "@/hooks/useConvexQuery";

interface Holiday {
  id: PublicHolidayId; name: string; date: string; description: string | null; is_recurring: boolean; created_at: string;
}

const holidayDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const Holidays = () => {
  const { isAdmin } = useRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const year = Number(yearFilter);
  const { data: holidaysData, loading: pageLoading, refetch: refetchHolidays } = useConvexQuery(
    api.admin.getHolidays,
    { year },
    [year],
  );
  const holidays = (holidaysData as Holiday[] | null) ?? [];

  const { mutate: saveHoliday, loading: saving } = useConvexMutation(api.admin.saveHoliday, {
    errorFallback: "Failed to save holiday",
  });
  const { mutate: deleteHoliday } = useConvexMutation(api.admin.deleteHoliday, {
    successMessage: "Holiday deleted",
    errorFallback: "Failed to delete holiday",
  });

  const isInitialLoad = pageLoading && holidaysData === null;
  if (isInitialLoad) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} cols={4} />
    </div>
  );

  const openCreate = () => { setEditing(null); setName(""); setDate(""); setDescription(""); setIsRecurring(false); setDialogOpen(true); };
  const openEdit = (h: Holiday) => { setEditing(h); setName(h.name); setDate(h.date); setDescription(h.description || ""); setIsRecurring(h.is_recurring); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim() || !date) return;
    try {
      const result = await saveHoliday({
        holidayId: editing?.id,
        name: name.trim(),
        date,
        description: description.trim() || undefined,
        isRecurring,
      });
      if (result !== null) {
        await refetchHolidays();
        setDialogOpen(false);
        toast.success(editing ? "Holiday updated" : "Holiday added");
      }
    } catch {
      // saveHoliday already toasts
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteHoliday({ holidayId: deleteTarget.id });
    if (result !== null) {
      await refetchHolidays();
      setDeleteTarget(null);
    }
  };

  const isPast = (d: string) => parseISO(d) < new Date();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Calendar</p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground flex items-center gap-2">
            <CalendarHeart className="h-6 w-6 text-foreground" /> Public Holidays
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Company-wide public holidays calendar.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Label className="sr-only" htmlFor="holiday-year-filter">Holiday year</Label>
            <Input
              id="holiday-year-filter"
              name="holidayYear"
              type="number"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Filter holidays by year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-10 w-full sm:w-24"
              min={2020}
              max={2030}
            />
          </div>
          {isAdmin && (
            <Button onClick={openCreate} className="h-10 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Holiday
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Holidays in {yearFilter}
            <Badge variant="secondary" className="text-xs">{holidays.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No holidays found for {yearFilter}.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Recurring</TableHead>
                  {isAdmin && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((h) => (
                  <TableRow key={h.id} className={isPast(h.date) ? "opacity-50" : ""}>
                    <TableCell className="font-medium tabular-nums">{holidayDateFormatter.format(parseISO(h.date))}</TableCell>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground hidden md:table-cell">{h.description || "—"}</TableCell>
                    <TableCell>{h.is_recurring ? <Badge variant="secondary" className="text-xs">Yearly</Badge> : "—"}</TableCell>
                    {isAdmin && (
                      <TableCell className="space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(h)} className="h-8 w-8" aria-label={`Edit ${h.name}`} title={`Edit ${h.name}`}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(h)} className="h-8 w-8" aria-label={`Delete ${h.name}`} title={`Delete ${h.name}`}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
            <DialogDescription>
              Add or update a public holiday that appears in calendars and dashboards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="holiday-name">Holiday Name</Label><Input id="holiday-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Year's Day" className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="holiday-date">Date</Label><Input id="holiday-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="holiday-desc">Description (optional)</Label><Textarea id="holiday-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
            <div className="flex items-center space-x-2"><Checkbox id="recurring" checked={isRecurring} onCheckedChange={(v) => setIsRecurring(v === true)} /><Label htmlFor="recurring">Recurring every year</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim() || !date}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteTarget?.name}"?</AlertDialogDescription>
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

export default Holidays;
