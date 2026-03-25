import { describe, expect, it } from "vitest";

import {
  filterVisibleExpenses,
  normalizeExpenseSubmission,
  summarizeExpenseStatuses,
} from "./expenses";

describe("normalizeExpenseSubmission", () => {
  it("trims strings, normalizes currency, and rounds the amount", () => {
    expect(normalizeExpenseSubmission({
      amount: 42.567,
      currency: " aed ",
      description: " taxi from airport ",
      expenseDate: "2026-03-25",
      title: " Airport taxi ",
    })).toEqual({
      amount: 42.57,
      currency: "AED",
      description: "taxi from airport",
      title: "Airport taxi",
    });
  });

  it("rejects invalid amounts", () => {
    expect(() => normalizeExpenseSubmission({
      amount: 0,
      expenseDate: "2026-03-25",
      title: "Taxi",
    })).toThrow("Expense amount must be greater than zero");
  });
});

describe("expense approval helpers", () => {
  const expenses = [
    { employeeUserId: "emp-1", id: "1", status: "pending" as const },
    { employeeUserId: "emp-2", id: "2", status: "approved" as const },
    { employeeUserId: "emp-1", id: "3", status: "rejected" as const },
  ];

  it("filters expenses to the managed employee scope", () => {
    expect(filterVisibleExpenses(expenses, new Set(["emp-1"]))).toEqual([
      { employeeUserId: "emp-1", id: "1", status: "pending" },
      { employeeUserId: "emp-1", id: "3", status: "rejected" },
    ]);
  });

  it("summarizes pending, approved, and rejected totals", () => {
    expect(summarizeExpenseStatuses(expenses)).toEqual({
      approved: 1,
      pending: 1,
      rejected: 1,
    });
  });
});
