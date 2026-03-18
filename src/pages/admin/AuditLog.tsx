import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
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
import { buildCSV, downloadCSV } from "@/lib/csv";
import type { BadgeProps } from "@/components/ui/badge";
import type { FunctionReturnType } from "convex/server";

type AuditEntry = FunctionReturnType<typeof api.admin.getAuditLogData>[number];

const ACTION_COLORS: Record<string, NonNullable<BadgeProps["variant"]>> = {
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
  const { page, totalPages, paginatedItems: paginated, setPage, totalItems } = usePagination(filtered, 20);

  useEffect(() => {
    const fetch = async () => {
      const [logsRes, profilesRes] = await Promise.all([
        convex.query(api.admin.getAuditLogData, {}),
        convex.query(api.admin.getEmployeesData, {}),
      ]);
      if (logsRes) setLogs(logsRes);
      if (profilesRes?.employees) {
        const map: Record<string, string> = {};
        profilesRes.employees.forEach((p) => { map[p.id] = p.full_name || p.email || p.id; });
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
    const csv = buildCSV(
      ["Timestamp", "Table", "Action", "Changed By", "Summary"],
      filtered.map((l) => [l.created_at, l.table_name, l.action, profiles[l.changed_by || ""] || l.changed_by || "System", summarizeChange(l)])
    );
    downloadCSV(csv, "audit-log.csv");
  };

  if (loading) return <div className="space-y-6"><PageHeaderSkeleton /><TableSkeleton rows={8} cols={5} /></div>;

  const tables = [...new Set(logs.map((l) => l.table_name))];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-foreground" /> Audit Log
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Track all changes to balances, roles, attendance, and leave requests.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue /></SelectTrigger>
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
                        <Badge variant={ACTION_COLORS[entry.action] || "default"} className="text-xs">
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
          {totalPages > 1 && <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
