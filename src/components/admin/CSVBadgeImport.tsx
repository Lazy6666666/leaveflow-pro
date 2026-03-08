import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ParsedRow {
  email: string;
  badge_id: string;
  vendor: string | null;
  matched_profile?: Profile;
  error?: string;
}

interface CSVBadgeImportProps {
  profiles: Profile[];
  onImportComplete: () => void;
}

export default function CSVBadgeImport({ profiles, onImportComplete }: CSVBadgeImportProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const profileByEmail = new Map(profiles.map((p) => [p.email?.toLowerCase(), p]));

  const reset = () => {
    setRows([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast({ title: "CSV must have a header row and at least one data row", variant: "destructive" });
        return;
      }

      const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
      const emailIdx = header.findIndex((h) => h === "email");
      const badgeIdx = header.findIndex((h) => h === "badge_id" || h === "badge");
      const vendorIdx = header.findIndex((h) => h === "vendor");

      if (emailIdx === -1 || badgeIdx === -1) {
        toast({ title: "CSV must have 'email' and 'badge_id' columns", variant: "destructive" });
        return;
      }

      const parsed: ParsedRow[] = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        const email = cols[emailIdx] || "";
        const badge_id = cols[badgeIdx] || "";
        const vendor = vendorIdx !== -1 ? cols[vendorIdx] || null : null;
        const matched = profileByEmail.get(email.toLowerCase());

        return {
          email,
          badge_id,
          vendor: vendor || null,
          matched_profile: matched,
          error: !email ? "Missing email" : !badge_id ? "Missing badge ID" : !matched ? "Employee not found" : undefined,
        };
      });

      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const validRows = rows.filter((r) => !r.error);
  const errorRows = rows.filter((r) => r.error);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);

    const inserts = validRows.map((r) => ({
      employee_id: r.matched_profile!.id,
      badge_id: r.badge_id,
      vendor: r.vendor,
    }));

    const { error, data } = await supabase.from("badge_mappings").insert(inserts as any).select();
    setImporting(false);

    if (error) {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    } else {
      const count = data?.length || inserts.length;
      setResult({ success: count, failed: errorRows.length });
      toast({ title: `Imported ${count} badge mapping(s)` });
      onImportComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Import CSV</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Badge Mappings from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              CSV format: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">email,badge_id,vendor</code>
              <br />
              <span className="text-xs">The vendor column is optional.</span>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:cursor-pointer cursor-pointer"
            />
          </div>

          {rows.length > 0 && !result && (
            <>
              <div className="flex gap-3 text-sm">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {validRows.length} valid
                </Badge>
                {errorRows.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" /> {errorRows.length} errors
                  </Badge>
                )}
              </div>

              <div className="rounded-md border max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Badge ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i} className={r.error ? "bg-destructive/5" : ""}>
                        <TableCell className="text-sm">{r.email}</TableCell>
                        <TableCell><code className="text-sm bg-muted px-1.5 py-0.5 rounded">{r.badge_id}</code></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.vendor || "All"}</TableCell>
                        <TableCell>
                          {r.error ? (
                            <span className="text-xs text-destructive">{r.error}</span>
                          ) : (
                            <span className="text-xs text-green-600">✓ {r.matched_profile?.full_name}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button className="w-full" onClick={handleImport} disabled={importing || validRows.length === 0}>
                {importing ? "Importing..." : `Import ${validRows.length} Mapping(s)`}
              </Button>
            </>
          )}

          {result && (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-500" />
              <p className="text-sm font-medium">{result.success} mapping(s) imported successfully</p>
              {result.failed > 0 && (
                <p className="text-xs text-muted-foreground">{result.failed} row(s) skipped due to errors</p>
              )}
              <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>Done</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
