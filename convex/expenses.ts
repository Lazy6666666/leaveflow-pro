import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

import {
  canManageEmployee,
  getManagedEmployeeIds,
  getProfileByUserId,
  now,
  recordAudit,
  requireAnyRole,
  requireIdentity,
  toIso,
} from "./lib/auth";

const expenseCategoryValidator = v.union(
  v.literal("travel"),
  v.literal("meals"),
  v.literal("lodging"),
  v.literal("supplies"),
  v.literal("client"),
  v.literal("mileage"),
  v.literal("other"),
);

const expenseStatusValidator = v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"));
const approvalActionValidator = v.union(v.literal("approved"), v.literal("rejected"));

const EXPENSE_CATEGORY_LABELS = {
  client: "Client meeting",
  lodging: "Lodging",
  meals: "Meals",
  mileage: "Mileage",
  other: "Other",
  supplies: "Office supplies",
  travel: "Travel",
} as const;

type ExpenseDoc = Doc<"expenses">;

type ExpenseStatus = "pending" | "approved" | "rejected";

export function normalizeExpenseSubmission(input: {
  amount: number;
  currency?: string;
  description?: string;
  expenseDate: string;
  title: string;
}) {
  const trimmedTitle = input.title.trim();
  const trimmedDescription = input.description?.trim();
  const currency = input.currency?.trim().toUpperCase() || "AED";

  if (!trimmedTitle) {
    throw new Error("Expense title is required");
  }
  if (!input.expenseDate) {
    throw new Error("Expense date is required");
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Expense amount must be greater than zero");
  }

  return {
    amount: Number(input.amount.toFixed(2)),
    currency,
    description: trimmedDescription || undefined,
    title: trimmedTitle,
  };
}

export function filterVisibleExpenses<T extends { employeeUserId: string }>(
  expenses: T[],
  managedEmployeeIds: Set<string> | null,
) {
  return expenses.filter((expense) => managedEmployeeIds ? managedEmployeeIds.has(expense.employeeUserId) : true);
}

export function summarizeExpenseStatuses<T extends { status: ExpenseStatus }>(expenses: T[]) {
  return {
    approved: expenses.filter((expense) => expense.status === "approved").length,
    pending: expenses.filter((expense) => expense.status === "pending").length,
    rejected: expenses.filter((expense) => expense.status === "rejected").length,
  };
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

async function buildProfileMap(ctx: QueryCtx | MutationCtx) {
  const profiles = await ctx.db.query("profiles").collect();
  return new Map(profiles.map((profile) => [profile.userId, profile.fullName ?? profile.email ?? profile.userId]));
}

function serializeExpense(
  expense: NonNullable<ExpenseDoc>,
  profileMap: Map<string, string>,
) {
  return {
    amount: expense.amount,
    amountLabel: formatAmount(expense.amount, expense.currency),
    category: expense.category,
    categoryLabel: EXPENSE_CATEGORY_LABELS[expense.category],
    createdAt: toIso(expense.createdAt),
    currency: expense.currency,
    description: expense.description ?? "",
    employeeName: profileMap.get(expense.employeeUserId) ?? expense.employeeUserId,
    employeeUserId: expense.employeeUserId,
    expenseDate: expense.expenseDate,
    id: expense._id,
    reviewerComment: expense.reviewerComment ?? "",
    reviewerName: expense.reviewerUserId ? (profileMap.get(expense.reviewerUserId) ?? expense.reviewerUserId) : null,
    reviewerUserId: expense.reviewerUserId ?? null,
    reviewedAt: toIso(expense.reviewedAt),
    status: expense.status,
    title: expense.title,
    updatedAt: toIso(expense.updatedAt),
  };
}

export const getMyExpenses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const [expenses, profileMap] = await Promise.all([
      ctx.db
        .query("expenses")
        .withIndex("by_employeeUserId", (q) => q.eq("employeeUserId", identity.subject))
        .collect(),
      buildProfileMap(ctx),
    ]);

    return {
      categories: Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({ label, value })),
      expenses: expenses
        .sort((left, right) => right.createdAt - left.createdAt)
        .map((expense) => serializeExpense(expense, profileMap)),
    };
  },
});

export const submitExpense = mutation({
  args: {
    amount: v.number(),
    category: expenseCategoryValidator,
    currency: v.optional(v.string()),
    description: v.optional(v.string()),
    expenseDate: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const normalized = normalizeExpenseSubmission(args);

    const timestamp = now();
    const expenseId = await ctx.db.insert("expenses", {
      amount: normalized.amount,
      category: args.category,
      createdAt: timestamp,
      createdBy: identity.subject,
      currency: normalized.currency,
      description: normalized.description,
      employeeUserId: identity.subject,
      expenseDate: args.expenseDate,
      reviewerComment: undefined,
      reviewerUserId: undefined,
      reviewedAt: undefined,
      status: "pending",
      title: normalized.title,
      updatedAt: timestamp,
    });

    await recordAudit(ctx, {
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(expenseId),
      recordId: String(expenseId),
      tableName: "expenses",
    });

    return { id: expenseId };
  },
});

export const getExpenseApprovalQueue = query({
  args: {},
  handler: async (ctx) => {
    const { identity, roles } = await requireAnyRole(ctx, ["manager", "hr_admin"]);
    const [expenses, approvals, profileMap] = await Promise.all([
      ctx.db.query("expenses").collect(),
      ctx.db.query("expenseApprovalRecords").collect(),
      buildProfileMap(ctx),
    ]);

    const managedEmployeeIds = roles.includes("hr_admin")
      ? null
      : new Set(await getManagedEmployeeIds(ctx, identity.subject));

    const visibleExpenses = filterVisibleExpenses(expenses, managedEmployeeIds);

    const serializedExpenses = visibleExpenses
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((expense) => serializeExpense(expense, profileMap));

    return {
      pendingExpenses: serializedExpenses.filter((expense) => expense.status === "pending"),
      recentDecisions: serializedExpenses.filter((expense) => expense.status !== "pending").slice(0, 8),
      totals: summarizeExpenseStatuses(visibleExpenses),
      visibleEmployeeCount: managedEmployeeIds ? managedEmployeeIds.size : new Set(visibleExpenses.map((expense) => expense.employeeUserId)).size,
      recentApprovalRecords: approvals
        .sort((left, right) => right.createdAt - left.createdAt)
        .filter((approval) =>
          visibleExpenses.some((expense) => String(expense._id) === String(approval.expenseId)))
        .slice(0, 10)
        .map((approval) => ({
          action: approval.action,
          actedByName: profileMap.get(approval.actedByUserId) ?? approval.actedByUserId,
          comment: approval.comment ?? "",
          createdAt: toIso(approval.createdAt),
          expenseId: approval.expenseId,
          id: approval._id,
        })),
    };
  },
});

export const decideExpense = mutation({
  args: {
    action: approvalActionValidator,
    comment: v.optional(v.string()),
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireAnyRole(ctx, ["manager", "hr_admin"]);
    const expense = await ctx.db.get(args.expenseId);

    if (!expense) {
      throw new Error("Expense not found");
    }
    if (expense.status !== "pending") {
      throw new Error("Only pending expenses can be updated");
    }

    const canReview = roles.includes("hr_admin")
      ? true
      : await canManageEmployee(ctx, identity.subject, expense.employeeUserId, roles);

    if (!canReview) {
      throw new Error("Forbidden");
    }

    const trimmedComment = args.comment?.trim();
    const timestamp = now();
    const payload = {
      reviewerComment: trimmedComment || undefined,
      reviewerUserId: identity.subject,
      reviewedAt: timestamp,
      status: args.action,
      updatedAt: timestamp,
    } as const;

    await ctx.db.patch(args.expenseId, payload);
    const approvalId = await ctx.db.insert("expenseApprovalRecords", {
      action: args.action,
      actedByUserId: identity.subject,
      comment: trimmedComment || undefined,
      createdAt: timestamp,
      expenseId: args.expenseId,
    });

    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...expense, ...payload },
      oldData: expense,
      recordId: String(args.expenseId),
      tableName: "expenses",
    });

    await recordAudit(ctx, {
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(approvalId),
      recordId: String(approvalId),
      tableName: "expense_approval_records",
    });

    return { id: approvalId };
  },
});

export const getExpenseApprovalStatus = query({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const expense = await ctx.db.get(args.expenseId);

    if (!expense) {
      throw new Error("Expense not found");
    }
    if (expense.employeeUserId !== identity.subject) {
      throw new Error("Forbidden");
    }

    const profile = expense.reviewerUserId ? await getProfileByUserId(ctx, expense.reviewerUserId) : null;
    return {
      id: expense._id,
      reviewerComment: expense.reviewerComment ?? "",
      reviewerName: profile?.fullName ?? expense.reviewerUserId ?? null,
      reviewedAt: toIso(expense.reviewedAt),
      status: expense.status,
    };
  },
});

export const validators = {
  approvalActionValidator,
  expenseCategoryValidator,
  expenseStatusValidator,
};
