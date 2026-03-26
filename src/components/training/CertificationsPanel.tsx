import { useCallback, useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { wave2Api } from "@/lib/wave2Api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Award, Plus } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

type CertificationRecord = {
  employeeName: string;
  employeeUserId: string;
  expiresOn: string;
  id: string;
  issuedOn: string;
  name: string;
};

type ProfileOption = {
  fullName: string;
  userId: string;
};

export function CertificationsPanel() {
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);
  const [employeeUserId, setEmployeeUserId] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [records, setRecords] = useState<CertificationRecord[]>([]);

  const load = useCallback(async () => {
    const data = await convex.query(wave2Api.training.getTrainingData, {});
    setProfiles(data.profiles as ProfileOption[]);
    setRecords(data.certifications as CertificationRecord[]);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const createCertification = async () => {
    try {
      await convex.mutation(wave2Api.training.saveCertification, {
        employeeUserId,
        expiresOn,
        issuedOn,
        name,
      });
      toast.success("Certification recorded");
      setCertificationDialogOpen(false);
      setEmployeeUserId("");
      setExpiresOn("");
      setIssuedOn("");
      setName("");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save certification"));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Wave 2</p>
          <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
            <Award className="h-5 w-5" /> Certifications
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Track certifications and upcoming expiry dates.</p>
        </div>
        <Button onClick={() => setCertificationDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New certification
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Certification records <Badge variant="secondary">{records.length}</Badge></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Loading certifications…</p> : null}
          {!loading && records.length === 0 ? <p className="text-sm text-muted-foreground">No certifications recorded yet.</p> : null}
          {records.map((record) => (
            <div key={record.id} className="rounded-xl border border-border/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">{record.name}</h3>
                  <p className="text-sm text-muted-foreground">{record.employeeName}</p>
                </div>
                <Badge variant="secondary">Expires {record.expiresOn}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Issued on {record.issuedOn}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={certificationDialogOpen} onOpenChange={setCertificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create certification record</DialogTitle>
            <DialogDescription>Add a certification and track its expiry window.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="certification-name">Certification name</Label>
              <Input id="certification-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certification-employee">Employee</Label>
              <Select value={employeeUserId} onValueChange={setEmployeeUserId}>
                <SelectTrigger id="certification-employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.userId} value={profile.userId}>
                      {profile.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="certification-issued">Issued on</Label>
              <Input id="certification-issued" type="date" value={issuedOn} onChange={(event) => setIssuedOn(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certification-expires">Expires on</Label>
              <Input id="certification-expires" type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertificationDialogOpen(false)}>Cancel</Button>
            <Button disabled={!employeeUserId || !name.trim() || !issuedOn || !expiresOn} onClick={() => void createCertification()}>
              Save certification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
