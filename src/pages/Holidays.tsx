import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarHeart } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

interface Holiday {
  id: string; name: string; date: string; description: string | null; is_recurring: boolean; created_at: string;
}

const Holidays = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("hr_admin");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [loading, setLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const fetchHolidays = async () => {
    const { data } = await supabase.from("public_holidays").select("*").gte("date", `${yearFilter}-01-01`).lte("date", `${yearFilter}-12-31`).order("date");
    if (data) setHolidays(data);
  };

  useEffect(() => { fetchHolidays(); }, [yearFilter]);

  const openCreate = () => { setEditing(null); setName(""); setDate(""); setDescription(""); setIsRecurring(false); setDialogOpen(true); };
  const openEdit = (h: Holiday) => { setEditing(h); setName(h.name); setDate(h.date); setDescription(h.description || ""); setIsRecurring(h.is_recurring); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim() || !date) return;
    setLoading(true);
    const payload = { name: name.trim(), date, description: description.trim() || null, is_recurring: isRecurring };
    if (editing) {
      const { error } = await supabase.from("public_holidays").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message); else toast.success("Holiday updated");
    } else {
      const { error } = await supabase.from("public_holidays").insert(payload);
      if (error) toast.error(error.message); else toast.success("Holiday added");
    }
    setLoading(false); setDialogOpen(false); fetchHolidays();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("public_holidays").delete().eq("id", deleteTarget.id);
    if (error) toast.error(error.message); else toast.success("Holiday deleted");
    setDeleteTarget(null); fetchHolidays();
  };

  const isPast = (d: string) => parseISO(d) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarHeart className="h-6 w-6 text-primary" /> Public Holidays
          </h1>
          <p className="text-muted-foreground mt-1">Company-wide public holidays calendar</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="number" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-24 h-10" min={2020} max={2030} />
          {isAdmin && (
            <Button onClick={openCreate} className="h-10">
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
                    <TableCell className="font-medium tabular-nums">{format(parseISO(h.date), "EEE, MMM d")}</TableCell>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground hidden md:table-cell">{h.description || "—"}</TableCell>
                    <TableCell>{h.is_recurring ? <Badge variant="secondary" className="text-xs">Yearly</Badge> : "—"}</TableCell>
                    {isAdmin && (
                      <TableCell className="space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(h)} className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(h)} className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Holiday" : "Add Holiday"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="holiday-name">Holiday Name</Label><Input id="holiday-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Year's Day" className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="holiday-date">Date</Label><Input id="holiday-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="holiday-desc">Description (optional)</Label><Textarea id="holiday-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
            <div className="flex items-center space-x-2"><Checkbox id="recurring" checked={isRecurring} onCheckedChange={(v) => setIsRecurring(v === true)} /><Label htmlFor="recurring">Recurring every year</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !name.trim() || !date}>{loading ? "Saving..." : "Save"}</Button>
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
