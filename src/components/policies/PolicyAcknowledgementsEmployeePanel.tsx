import { useCallback, useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { wave3Api } from "@/lib/wave3Api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import type { PolicyAcknowledgementId, PolicyDocumentId } from "@/lib/convexTypes";
import { CheckCheck, FileText } from "lucide-react";
import { toast } from "sonner";

type EmployeeAcknowledgements = {
  assignments: Array<{
    acknowledgedAt: string | null;
    assignedAt: string | null;
    dueDate: string | null;
    documentPreview: string | null;
    documentUpdatedAt: string | null;
    id: PolicyAcknowledgementId;
    isOverdue: boolean;
    note: string;
    policyDocumentId: PolicyDocumentId;
    policyTitle: string;
    status: "pending" | "acknowledged";
  }>;
  summary: { acknowledged: number; overdue: number; pending: number };
};

function badgeVariant(status: "pending" | "acknowledged", isOverdue: boolean) {
  if (isOverdue) {
    return "destructive" as const;
  }
  return status === "acknowledged" ? "default" : "secondary";
}

export function PolicyAcknowledgementsEmployeePanel() {
  const [dashboard, setDashboard] = useState<EmployeeAcknowledgements>({
    assignments: [],
    summary: { acknowledged: 0, overdue: 0, pending: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await convex.query(wave3Api.policyAcknowledgements.getMyPolicyAcknowledgements, {});
    setDashboard(data as EmployeeAcknowledgements);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const acknowledge = async (acknowledgementId: PolicyAcknowledgementId) => {
    try {
      setSubmittingId(String(acknowledgementId));
      await convex.mutation(wave3Api.policyAcknowledgements.acknowledgePolicy, { acknowledgementId });
      toast.success("Policy acknowledged");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to acknowledge policy"));
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Wave 3</p>
        <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
          <FileText className="h-5 w-5" /> Policy Reviews
        </h2>
        <p className="text-sm text-muted-foreground">
          Review assigned policies, acknowledge them when complete, and keep a visible record of pending and overdue items.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{dashboard.summary.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Acknowledged</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{dashboard.summary.acknowledged}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{dashboard.summary.overdue}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your acknowledgements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Loading policy acknowledgements…</p> : null}
          {!loading && dashboard.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No policy acknowledgements are assigned to you right now.</p>
          ) : null}
          {dashboard.assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-xl border border-border/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">{assignment.policyTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    {assignment.dueDate ? `Due ${assignment.dueDate}` : "No due date"}
                    {assignment.documentUpdatedAt ? ` · Updated ${new Date(assignment.documentUpdatedAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <Badge variant={badgeVariant(assignment.status, assignment.isOverdue)}>
                  {assignment.isOverdue ? "overdue" : assignment.status}
                </Badge>
              </div>
              {assignment.note ? <p className="mt-3 text-sm text-muted-foreground">{assignment.note}</p> : null}
              {assignment.documentPreview ? (
                <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{assignment.documentPreview}…</p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {assignment.acknowledgedAt ? `Acknowledged ${new Date(assignment.acknowledgedAt).toLocaleString()}` : "Awaiting your acknowledgement"}
                </p>
                {assignment.status === "pending" ? (
                  <Button onClick={() => void acknowledge(assignment.id)} disabled={submittingId === String(assignment.id)}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    {submittingId === String(assignment.id) ? "Saving..." : "Acknowledge"}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
