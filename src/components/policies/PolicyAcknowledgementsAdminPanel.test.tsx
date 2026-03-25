// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PolicyAcknowledgementsAdminPanel } from "./PolicyAcknowledgementsAdminPanel";

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
    policyAcknowledgements: {
      assignPolicyAcknowledgement: "policyAcknowledgements:assignPolicyAcknowledgement",
      getPolicyAcknowledgementAdminOverview: "policyAcknowledgements:getPolicyAcknowledgementAdminOverview",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("PolicyAcknowledgementsAdminPanel", () => {
  beforeEach(() => {
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue({
      assignments: [],
      documents: [{ id: "policy_1", title: "Remote Work Policy", updatedAt: null }],
      employees: [{ email: "ava@example.com", name: "Ava Team", roles: ["employee"], userId: "user_1" }],
      summary: { acknowledged: 0, overdue: 0, pending: 0 },
    });
    mutationMock.mockResolvedValue({ id: "ack_1" });
  });

  it("assigns a policy acknowledgement", async () => {
    render(<PolicyAcknowledgementsAdminPanel />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /assign acknowledgement/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/policy document/i), { target: { value: "policy_1" } });
    fireEvent.change(screen.getByLabelText(/employee/i), { target: { value: "user_1" } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: "2026-03-31" } });
    fireEvent.change(screen.getByLabelText(/assignment note/i), { target: { value: "Read before payroll cutoff" } });
    fireEvent.click(screen.getByRole("button", { name: /assign acknowledgement/i }));

    await waitFor(() => {
      expect(mutationMock).toHaveBeenCalledWith(
        "policyAcknowledgements:assignPolicyAcknowledgement",
        expect.objectContaining({
          assigneeUserId: "user_1",
          dueDate: "2026-03-31",
          note: "Read before payroll cutoff",
          policyDocumentId: "policy_1",
        }),
      );
      expect(toastSuccessMock).toHaveBeenCalledWith("Policy acknowledgement assigned");
    });
  });
});
