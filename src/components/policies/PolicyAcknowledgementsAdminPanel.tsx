import { useCallback, useEffect, useMemo, useState } from "react";
import { convex } from "@/lib/convex";
import { wave3Api } from "@/lib/wave3Api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import type { PolicyAcknowledgementId, PolicyDocumentId } from "@/lib/convexTypes";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

type AdminOverview = {
  assignments: Array<{
    acknowledgedAt: string | null;
    assigneeName: string;
    assigneeUserId: string;
    assignedAt: string | null;
    assignedByName: string;
    dueDate: string | null;
    id: PolicyAcknowledgementId;
    isOverdue: boolean;
    note: string;
    policyDocumentId: PolicyDocumentId;
    policyTitle: string;
    status: "pending" | "acknowledged";
    updatedAt: string | null;
  }>;
  documents: Array<{ id: PolicyDocumentId; title: string; updatedAt: string | null }>;
  employees: Array<{ email: string | null; name: string; roles: string[]; userId: string }>;
  summary: { acknowledged: number; overdue: number; pending: number };
};

function statusVariant(status: "pending" | "acknowledged", isOverdue: boolean) {
  if (isOverdue) {
    return "destructive" as const;
  }
  return status === "acknowledged" ? "default" : "secondary";
}

export function PolicyAcknowledgementsAdminPanel() {
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [overview, setOverview] = useState<AdminOverview>({
    assignments: [],
    documents: [],
    employees: [],
    summary: { acknowledged: 0, overdue: 0, pending: 0 },
  });
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const data = await convex.query(wave3Api.policyAcknowledgements.getPolicyAcknowledgementAdminOverview, {});
    setOverview(data as AdminOverview);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const canAssign = useMemo(
    () => Boolean(selectedDocumentId && selectedEmployeeId),
    [selectedDocumentId, selectedEmployeeId],
  );

  const handleAssign = async () => {
    if (!canAssign) {
      toast.error("Choose a policy and employee before assigning");
      return;
    }

    try {
      setSubmitting(true);
      await convex.mutation(wave3Api.policyAcknowledgements.assignPolicyAcknowledgement, {
        assigneeUserId: selectedEmployeeId,
        dueDate: dueDate || undefined,
        note: note || undefined,
        policyDocumentId: selectedDocumentId as PolicyDocumentId,
      });
      toast.success("Policy acknowledgement assigned");
      setDueDate("");
      setNote("");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to assign policy acknowledgement"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Wave 3</p>
        <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
          <ClipboardList className="h-5 w-5" /> Policy Acknowledgements
        </h2>
        <p className="text-sm text-muted-foreground">
          Assign indexed policies for acknowledgement and monitor whether employees have completed their review.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{overview.summary.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Acknowledged</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{overview.summary.acknowledged}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{overview.summary.overdue}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign acknowledgement</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="policy-document">Policy document</Label>
            <select
              id="policy-document"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedDocumentId}
              onChange={(event) => setSelectedDocumentId(event.target.value)}
            >
              <option value="">Select a policy</option>
              {overview.documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy-employee">Employee</Label>
            <select
              id="policy-employee"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
            >
              <option value="">Select an employee</option>
              {overview.employees.map((employee) => (
                <option key={employee.userId} value={employee.userId}>
                  {employee.name}{employee.roles.length ? ` — ${employee.roles.join(", ")}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy-due-date">Due date</Label>
            <Input id="policy-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="policy-note">Assignment note</Label>
            <Textarea
              id="policy-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional context for the employee, for example: review before next Monday’s team briefing."
            />
          </div>
          <div className="lg:col-span-2">
            <Button onClick={() => void handleAssign()} disabled={submitting || loading}>
              {submitting ? "Assigning..." : "Assign acknowledgement"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignment status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Loading acknowledgement assignments…</p> : null}
          {!loading && overview.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No policy acknowledgements assigned yet.</p>
          ) : null}
          {overview.assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-xl border border-border/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">{assignment.policyTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    Assigned to {assignment.assigneeName}
                    {assignment.assignedAt ? ` · ${new Date(assignment.assignedAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <Badge variant={statusVariant(assignment.status, assignment.isOverdue)}>
                  {assignment.isOverdue ? "overdue" : assignment.status}
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Assigned by {assignment.assignedByName}</p>
                <p>{assignment.dueDate ? `Due ${assignment.dueDate}` : "No due date set"}</p>
                <p>{assignment.acknowledgedAt ? `Acknowledged ${new Date(assignment.acknowledgedAt).toLocaleString()}` : "Awaiting acknowledgement"}</p>
                <p>{assignment.note ? `Note: ${assignment.note}` : "No assignment note"}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
