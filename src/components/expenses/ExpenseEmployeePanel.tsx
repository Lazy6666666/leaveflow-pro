import { useCallback, useEffect, useMemo, useState } from "react";
import { ReceiptText, Plus } from "lucide-react";

import { convex } from "@/lib/convex";
import { wave3Api } from "@/lib/wave3Api";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  DEFAULT_EXPENSE_CATEGORIES,
  EXPENSE_STATUS_VARIANT,
  type ExpenseCategory,
  type ExpenseCategoryOption,
} from "./expenseOptions";

type ExpenseItem = {
  amount: number;
  amountLabel: string;
  category: ExpenseCategory;
  categoryLabel: string;
  description: string;
  expenseDate: string;
  id: string;
  reviewerComment: string;
  reviewerName: string | null;
  reviewedAt: string | null;
  status: "pending" | "approved" | "rejected";
  title: string;
};

type ExpenseDashboardData = {
  categories: ExpenseCategoryOption[];
  expenses: ExpenseItem[];
};

type ExpenseFormState = {
  amount: string;
  category: ExpenseCategory;
  description: string;
  expenseDate: string;
  title: string;
};

const initialForm: ExpenseFormState = {
  amount: "",
  category: DEFAULT_EXPENSE_CATEGORIES[0].value,
  description: "",
  expenseDate: "",
  title: "",
};

export function ExpenseEmployeePanel() {
  const [dashboard, setDashboard] = useState<ExpenseDashboardData>({ categories: [...DEFAULT_EXPENSE_CATEGORIES], expenses: [] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const data = await convex.query(wave3Api.expenses.getMyExpenses, {});
    setDashboard({
      categories: (data.categories?.length ? data.categories : DEFAULT_EXPENSE_CATEGORIES) as ExpenseCategoryOption[],
      expenses: data.expenses as ExpenseItem[],
    });
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const stats = useMemo(() => ({
    approved: dashboard.expenses.filter((expense) => expense.status === "approved").length,
    pending: dashboard.expenses.filter((expense) => expense.status === "pending").length,
    rejected: dashboard.expenses.filter((expense) => expense.status === "rejected").length,
  }), [dashboard.expenses]);

  const submitExpense = async () => {
    try {
      setSubmitting(true);
      await convex.mutation(wave3Api.expenses.submitExpense, {
        amount: Number(form.amount),
        category: form.category,
        description: form.description || undefined,
        expenseDate: form.expenseDate,
        title: form.title,
      });
      toast.success("Expense submitted");
      setDialogOpen(false);
      setForm(initialForm);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to submit expense"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Wave 3</p>
          <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
            <ReceiptText className="h-5 w-5" /> Expense Claims
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit work expenses and follow each approval decision without leaving your employee hub.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Submit expense
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.approved}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.rejected}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Loading expenses…</p> : null}
          {!loading && dashboard.expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses submitted yet.</p>
          ) : null}
          {dashboard.expenses.map((expense) => (
            <div key={expense.id} className="rounded-xl border border-border/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">{expense.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {expense.categoryLabel} · {expense.expenseDate}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">{expense.amountLabel}</div>
                  <Badge variant={EXPENSE_STATUS_VARIANT[expense.status]}>{expense.status}</Badge>
                </div>
              </div>
              {expense.description ? <p className="mt-3 text-sm text-muted-foreground">{expense.description}</p> : null}
              {expense.reviewerName ? (
                <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{expense.reviewerName}</span> reviewed this expense
                  {expense.reviewerComment ? ` — ${expense.reviewerComment}` : "."}
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit expense</DialogTitle>
            <DialogDescription>Capture the expense details for manager or HR approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="expense-title">Title</Label>
              <Input id="expense-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expense-category">Category</Label>
                <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                  <SelectTrigger id="expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboard.categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount</Label>
                <Input
                  id="expense-amount"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Expense date</Label>
              <Input id="expense-date" type="date" value={form.expenseDate} onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-description">Description</Label>
              <Textarea
                id="expense-description"
                rows={4}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={submitting || !form.title.trim() || !form.amount || !form.expenseDate}
              onClick={() => void submitExpense()}
            >
              {submitting ? "Submitting..." : "Submit expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
