// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExpenseApprovalPanel } from "./ExpenseApprovalPanel";

const queryMock = vi.fn();
const mutationMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/convex", () => ({
  convex: {
    mutation: (...args: unknown[]) => mutationMock(...args),
    query: (...args: unknown[]) => queryMock(...args),
  },
}));

vi.mock("@/lib/wave3Api", () => ({
  wave3Api: {
    expenses: {
      decideExpense: "expenses:decideExpense",
      getExpenseApprovalQueue: "expenses:getExpenseApprovalQueue",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("ExpenseApprovalPanel", () => {
  beforeEach(() => {
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue({
      pendingExpenses: [
        {
          amountLabel: "AED 42.50",
          categoryLabel: "Travel",
          employeeName: "Ava Team",
          expenseDate: "2026-03-25",
          id: "expense_1",
          reviewerComment: "",
          reviewerName: null,
          status: "pending",
          title: "Airport taxi",
        },
      ],
      recentDecisions: [],
      totals: { approved: 0, pending: 1, rejected: 0 },
      visibleEmployeeCount: 1,
    });
    mutationMock.mockResolvedValue({ id: "approval_1" });
  });

  it("renders pending expenses", async () => {
    render(<ExpenseApprovalPanel />);

    await waitFor(() => {
      expect(screen.getByText("Airport taxi")).toBeInTheDocument();
      expect(screen.getByText("Ava Team")).toBeInTheDocument();
    });
  });

  it("approves a pending expense", async () => {
    render(<ExpenseApprovalPanel />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    fireEvent.change(screen.getByPlaceholderText(/optional reviewer note/i), { target: { value: "Looks good" } });
    fireEvent.click(screen.getByRole("button", { name: /approve expense/i }));

    await waitFor(() => {
      expect(mutationMock).toHaveBeenCalledWith(
        "expenses:decideExpense",
        expect.objectContaining({
          action: "approved",
          comment: "Looks good",
          expenseId: "expense_1",
        }),
      );
      expect(toastSuccessMock).toHaveBeenCalledWith("Expense approved");
    });
  });
});
