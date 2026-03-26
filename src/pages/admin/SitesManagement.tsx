import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { getErrorMessage } from "@/lib/errors";

type Site = { _id: string; name: string; address?: string; timezone?: string; isActive: boolean };
type EmployeeRow = { id: string; full_name: string | null; email: string | null };

const empty = { name: "", address: "", timezone: "" };

const SitesManagement = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [siteSupervisors, setSiteSupervisors] = useState<Record<string, EmployeeRow[]>>({});
  const [eligibleSupervisors, setEligibleSupervisors] = useState<EmployeeRow[]>([]);
  const [pendingSupervisor, setPendingSupervisor] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const refresh = async () => {
    const [siteData, employeesData] = await Promise.all([
      convex.query(api.sites.listSites, {}),
      convex.query(api.admin.getEmployeesData, {}),
    ]);
    const nextSites = siteData as Site[];
    setSites(nextSites);

    const supervisorsBySite = await Promise.all(
      nextSites.map(async (site) => {
        const assignments = await convex.query(api.sites.getSiteSupervisors, { siteId: site._id as never });
        const rows = (assignments ?? [])
          .map((assignment) =>
            (employeesData.employees as EmployeeRow[]).find((employee) => employee.id === assignment.userId),
          )
          .filter((employee): employee is EmployeeRow => !!employee);
        return [site._id, rows] as const;
      }),
    );

    setSiteSupervisors(Object.fromEntries(supervisorsBySite));

    const managerIds = new Set(
      (employeesData.roles as Array<{ user_id: string; role: string }>)
        .filter((role) => role.role === "manager" || role.role === "hr_admin")
        .map((role) => role.user_id),
    );
    setEligibleSupervisors(
      (employeesData.employees as EmployeeRow[])
        .filter((employee) => managerIds.has(employee.id))
        .sort((left, right) => (left.full_name || left.email || left.id).localeCompare(right.full_name || right.email || right.id)),
    );
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditId(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (s: Site) => { setEditId(s._id); setForm({ name: s.name, address: s.address ?? "", timezone: s.timezone ?? "" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (editId) {
        await convex.mutation(api.sites.updateSite, { siteId: editId as never, name: form.name, address: form.address || undefined, timezone: form.timezone || undefined });
      } else {
        await convex.mutation(api.sites.createSite, { name: form.name, address: form.address || undefined, timezone: form.timezone || undefined });
      }
      await refresh();
      setDialogOpen(false);
      toast.success(editId ? "Site updated" : "Site created");
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save site"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm("Delete this site?")) return;
    try {
      await convex.mutation(api.sites.deleteSite, { siteId: siteId as never });
      await refresh();
      toast.success("Site deleted");
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to delete site"));
    }
  };

  const handleAssignSupervisor = async (siteId: string) => {
    const userId = pendingSupervisor[siteId];
    if (!userId) {
      toast.error("Select a supervisor first");
      return;
    }

    try {
      await convex.mutation(api.sites.addSiteSupervisor, { siteId: siteId as never, userId });
      await refresh();
      setPendingSupervisor((current) => ({ ...current, [siteId]: "" }));
      toast.success("Supervisor assigned");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to assign supervisor"));
    }
  };

  const handleRemoveSupervisor = async (siteId: string, userId: string) => {
    try {
      await convex.mutation(api.sites.removeSiteSupervisor, { siteId: siteId as never, userId });
      await refresh();
      toast.success("Supervisor removed");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove supervisor"));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight">
            <Building2 className="h-5 w-5" /> Sites Management
          </h1>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Site</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sites.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No sites yet. Create one to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sites.map((site) => (
            <Card key={site._id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{site.name}</CardTitle>
                  <Badge variant={site.isActive ? "default" : "secondary"}>{site.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {site.address && <p>{site.address}</p>}
                {site.timezone && <p>TZ: {site.timezone}</p>}
                <div className="space-y-2 pt-3">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    <UserPlus className="h-3.5 w-3.5" />
                    Site Supervisors
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(siteSupervisors[site._id] ?? []).length > 0 ? (
                      (siteSupervisors[site._id] ?? []).map((supervisor) => (
                        <Badge key={supervisor.id} variant="secondary" className="gap-2 py-1">
                          <span>{supervisor.full_name || supervisor.email || supervisor.id}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => void handleRemoveSupervisor(site._id, supervisor.id)}
                            aria-label={`Remove ${supervisor.full_name || supervisor.email || supervisor.id}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No supervisors assigned yet.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                      value={pendingSupervisor[site._id] ?? ""}
                      onChange={(event) =>
                        setPendingSupervisor((current) => ({ ...current, [site._id]: event.target.value }))
                      }
                    >
                      <option value="">Assign a manager</option>
                      {eligibleSupervisors.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name || employee.email || employee.id}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" variant="outline" onClick={() => void handleAssignSupervisor(site._id)}>
                      <UserPlus className="mr-1 h-3 w-3" />
                      Assign
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(site)}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => void handleDelete(site._id)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Site" : "New Site"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
            <div><Label>Timezone</Label><Input placeholder="e.g. Asia/Manila" value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={saving} onClick={() => void handleSave()}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SitesManagement;
