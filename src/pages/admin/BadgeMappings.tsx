import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CreditCard, Search } from "lucide-react";
import CSVBadgeImport from "@/components/admin/CSVBadgeImport";
import { getErrorMessage } from "@/lib/errors";
import type { BadgeMappingId } from "@/lib/convexTypes";

interface BadgeMapping {
  id: BadgeMappingId;
  employee_id: string;
  badge_id: string;
  vendor: string | null;
  created_at: string;
  employee_name?: string;
  employee_email?: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

const BadgeMappings = () => {
  const [mappings, setMappings] = useState<BadgeMapping[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Form
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formBadgeId, setFormBadgeId] = useState("");
  const [formVendor, setFormVendor] = useState("all");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const data = await convex.query(api.admin.getBadgeMappingsData, {});
    setMappings(data.mappings as BadgeMapping[]);
    setProfiles(data.profiles as Profile[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!formEmployeeId || !formBadgeId.trim()) {
      toast({ title: "Employee and Badge ID required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await convex.mutation(api.admin.saveBadgeMapping, {
        employeeId: formEmployeeId,
        badgeId: formBadgeId.trim(),
        vendor: formVendor === "all" ? undefined : formVendor,
      });
      toast({ title: "Badge mapping added" });
      setFormBadgeId("");
      setFormEmployeeId("");
      setFormVendor("all");
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Failed to add mapping", description: getErrorMessage(error, "Failed to add mapping"), variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: BadgeMappingId) => {
    await convex.mutation(api.admin.deleteBadgeMapping, { mappingId: id });
    toast({ title: "Mapping removed" });
    fetchData();
  };

  const filtered = mappings.filter(
    (m) =>
      m.badge_id.toLowerCase().includes(search.toLowerCase()) ||
      (m.employee_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.employee_email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Badge ID Mappings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Link biometrics badge numbers to employee profiles for automatic sync
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Mapping</Button>
          </DialogTrigger>
          <CSVBadgeImport profiles={profiles} onImportComplete={fetchData} />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Badge Mapping</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name || p.email || p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Badge ID / Employee Code</Label>
                <Input
                  placeholder="e.g. 10042, EMP-001"
                  value={formBadgeId}
                  onChange={(e) => setFormBadgeId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The identifier used by the biometrics device (badge number, PIN, employee code)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Vendor (optional)</Label>
                <Select value={formVendor} onValueChange={setFormVendor}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All vendors</SelectItem>
                    <SelectItem value="zkteco">ZKTeco</SelectItem>
                    <SelectItem value="biotime">BioTime</SelectItem>
                    <SelectItem value="suprema">Suprema</SelectItem>
                    <SelectItem value="hikvision">HikVision</SelectItem>
                    <SelectItem value="generic_webhook">Generic Webhook</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Restrict this badge ID to a specific vendor, or use "All" for universal matching
                </p>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={saving}>
                {saving ? "Adding..." : "Add Mapping"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, email, or badge ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground p-6">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No badge mappings found.</p>
              <p className="text-xs text-muted-foreground mt-1">Add mappings so biometrics devices can match punches to employees.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Badge ID</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{m.employee_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">{m.badge_id}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.vendor || "All"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BadgeMappings;
