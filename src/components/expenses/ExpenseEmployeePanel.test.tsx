// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExpenseEmployeePanel } from "./ExpenseEmployeePanel";

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
      getMyExpenses: "expenses:getMyExpenses",
      submitExpense: "expenses:submitExpense",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("ExpenseEmployeePanel", () => {
  beforeEach(() => {
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue({
      categories: [{ label: "Travel", value: "travel" }],
      expenses: [],
    });
    mutationMock.mockResolvedValue({ id: "expense_1" });
  });

  it("renders the empty state", async () => {
    render(<ExpenseEmployeePanel />);

    expect(screen.getByText("Expense Claims")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No expenses submitted yet.")).toBeInTheDocument();
    });
  });

  it("submits a new expense", async () => {
    render(<ExpenseEmployeePanel />);

    fireEvent.click(screen.getByRole("button", { name: /submit expense/i }));
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Airport taxi" } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "42.50" } });
    fireEvent.change(screen.getByLabelText(/expense date/i), { target: { value: "2026-03-25" } });
    fireEvent.click(screen.getByRole("button", { name: /^submit expense$/i }));

    await waitFor(() => {
      expect(mutationMock).toHaveBeenCalledWith(
        "expenses:submitExpense",
        expect.objectContaining({
          amount: 42.5,
          expenseDate: "2026-03-25",
          title: "Airport taxi",
        }),
      );
      expect(toastSuccessMock).toHaveBeenCalledWith("Expense submitted");
    });
  });
});
