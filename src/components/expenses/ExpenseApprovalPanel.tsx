import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";

import { convex } from "@/lib/convex";
import type { ExpenseId } from "@/lib/convexTypes";
import { wave3Api } from "@/lib/wave3Api";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { EXPENSE_STATUS_VARIANT } from "./expenseOptions";

type ExpenseApprovalItem = {
  amountLabel: string;
  categoryLabel: string;
  employeeName: string;
  expenseDate: string;
  id: ExpenseId;
  reviewerComment: string;
  reviewerName: string | null;
  status: "pending" | "approved" | "rejected";
  title: string;
};

type ApprovalQueueData = {
  pendingExpenses: ExpenseApprovalItem[];
  recentDecisions: ExpenseApprovalItem[];
  totals: { approved: number; pending: number; rejected: number };
  visibleEmployeeCount: number;
};

export function ExpenseApprovalPanel() {
  const [comment, setComment] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<ApprovalQueueData>({
    pendingExpenses: [],
    recentDecisions: [],
    totals: { approved: 0, pending: 0, rejected: 0 },
    visibleEmployeeCount: 0,
  });
  const [selectedExpense, setSelectedExpense] = useState<ExpenseApprovalItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const data = await convex.query(wave3Api.expenses.getExpenseApprovalQueue, {});
    setQueue({
      pendingExpenses: data.pendingExpenses as ExpenseApprovalItem[],
      recentDecisions: data.recentDecisions as ExpenseApprovalItem[],
      totals: data.totals as ApprovalQueueData["totals"],
      visibleEmployeeCount: data.visibleEmployeeCount as number,
    });
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const summaryCards = useMemo(() => ([
    { label: "Pending", value: queue.totals.pending },
    { label: "Approved", value: queue.totals.approved },
    { label: "Rejected", value: queue.totals.rejected },
  ]), [queue.totals]);

  const handleDecision = async () => {
    if (!selectedExpense || !decision) {
      return;
    }

    try {
      setSubmitting(true);
      await convex.mutation(wave3Api.expenses.decideExpense, {
        action: decision,
        comment: comment || undefined,
        expenseId: selectedExpense.id,
      });
      toast.success(`Expense ${decision}`);
      setComment("");
      setDecision(null);
      setDialogOpen(false);
      setSelectedExpense(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update expense"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Wave 3</p>
        <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
          <CheckSquare className="h-5 w-5" /> Expense Approvals
        </h2>
        <p className="text-sm text-muted-foreground">
          Review submitted expenses for your direct reports and keep a visible record of recent decisions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{card.value}</CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Employees in scope</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{queue.visibleEmployeeCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading approval queue…</p> : null}
          {!loading && queue.pendingExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending expense approvals.</p>
          ) : null}
          {queue.pendingExpenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Expense</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.pendingExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.employeeName}</TableCell>
                    <TableCell>
                      <div className="font-medium">{expense.title}</div>
                      <div className="text-xs text-muted-foreground">{expense.categoryLabel}</div>
                    </TableCell>
                    <TableCell>{expense.expenseDate}</TableCell>
                    <TableCell>{expense.amountLabel}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setDecision("approved");
                            setDialogOpen(true);
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setDecision("rejected");
                            setDialogOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent decisions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && queue.recentDecisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expense decisions recorded yet.</p>
          ) : null}
          {queue.recentDecisions.map((expense) => (
            <div key={expense.id} className="rounded-xl border border-border/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">{expense.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {expense.employeeName} · {expense.categoryLabel} · {expense.expenseDate}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{expense.amountLabel}</div>
                  <Badge variant={EXPENSE_STATUS_VARIANT[expense.status]}>{expense.status}</Badge>
                </div>
              </div>
              {expense.reviewerName ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Reviewed by <span className="font-medium text-foreground">{expense.reviewerName}</span>
                  {expense.reviewerComment ? ` — ${expense.reviewerComment}` : "."}
                </p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setComment("");
            setDecision(null);
            setSelectedExpense(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision === "approved" ? "Approve" : "Reject"} expense</DialogTitle>
            <DialogDescription>Add an optional note to explain the approval decision.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-4 text-sm">
              <p><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{selectedExpense?.employeeName}</span></p>
              <p><span className="text-muted-foreground">Expense:</span> <span className="font-medium">{selectedExpense?.title}</span></p>
              <p><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{selectedExpense?.amountLabel}</span></p>
            </div>
            <Textarea
              placeholder="Optional reviewer note"
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={submitting}
              variant={decision === "rejected" ? "destructive" : "default"}
              onClick={() => void handleDecision()}
            >
              {submitting ? "Saving..." : decision === "approved" ? "Approve expense" : "Reject expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
