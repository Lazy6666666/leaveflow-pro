import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";

interface AuditEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  changed_by: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

const AuditLog = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState("all");
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  const filtered = tableFilter === "all" ? logs : logs.filter((l) => l.table_name === tableFilter);
  const { page, totalPages, paginated, setPage } = usePagination(filtered, 20);

  useEffect(() => {
    const fetch = async () => {
      const [logsRes, profilesRes] = await Promise.all([
        supabase
          .from("audit_logs" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("profiles").select("id, full_name, email"),
      ]);
      if (logsRes.data) setLogs(logsRes.data as unknown as AuditEntry[]);
      if (profilesRes.data) {
        const map: Record<string, string> = {};
        profilesRes.data.forEach((p: any) => { map[p.id] = p.full_name || p.email || p.id; });
        setProfiles(map);
      }
    };
    fetch().finally(() => setLoading(false));
  }, []);

  const summarizeChange = (entry: AuditEntry): string => {
    if (entry.action === "INSERT") return "Created new record";
    if (entry.action === "DELETE") return "Deleted record";
    if (!entry.old_data || !entry.new_data) return "Updated record";
    const changes: string[] = [];
    for (const key of Object.keys(entry.new_data)) {
      if (JSON.stringify(entry.old_data[key]) !== JSON.stringify(entry.new_data[key])) {
        changes.push(key.replace(/_/g, " "));
      }
    }
    return changes.length > 0 ? `Changed: ${changes.slice(0, 3).join(", ")}${changes.length > 3 ? ` +${changes.length - 3} more` : ""}` : "No visible changes";
  };

  const exportCSV = () => {
    let csv = "Timestamp,Table,Action,Changed By,Summary\n";
    filtered.forEach((l) => {
      csv += `"${l.created_at}","${l.table_name}","${l.action}","${profiles[l.changed_by || ""] || l.changed_by || "System"}","${summarizeChange(l)}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-log.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="space-y-6"><PageHeaderSkeleton /><TableSkeleton rows={8} cols={5} /></div>;

  const tables = [...new Set(logs.map((l) => l.table_name))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">Track all changes to balances, roles, attendance, and leave requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {tables.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Activity History
            <Badge variant="secondary" className="ml-2 text-xs">{filtered.length} entries</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Timestamp</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No audit entries found</TableCell></TableRow>
                ) : (
                  paginated.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {format(parseISO(entry.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {entry.table_name.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ACTION_COLORS[entry.action] as any || "default"} className="text-xs">
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{profiles[entry.changed_by || ""] || "System"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {summarizeChange(entry)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          {totalPages > 1 && <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
